import { BookingRepository } from "../repositories/booking.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { RoomRepository } from "../repositories/room.repository";
import { UserRepository } from "../repositories/user.repository";
import { BookingService } from "../services/booking.service";
import { PaymentService } from "../services/payment.service";
import { withAuth } from "../lib/auth";
import { UserRole } from "../types/rbac";
import type { UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import type {
  CreateBookingDTO,
  BookingDTO,
  BookingListQuery,
  BookingListResponse,
  UpdateBookingStatusDTO,
  CreatePaymentDTO,
  PaymentDTO,
  MidtransNotification
} from "../types/booking";
import {
  BookingStatus,
  PaymentStatus,
  PaymentType,
  LeaseType
} from "../types/booking";
import { ok, fail, notFound, badRequest, forbidden, internalError } from "../types/result";

// Midtrans Adapter
import { createSnapTransaction } from "../adapters/midtrans";

/**
 * Tier-2: Booking Application Services
 * Orchestrates booking management use cases
 */
export class BookingAPI {

  /**
   * Create a new booking with payment
   * Accessible by CUSTOMER role only
   */
  static createBooking = withAuth(
    async (userContext: UserContext, bookingData: CreateBookingDTO): Promise<Result<{ booking: BookingDTO; paymentToken?: string }>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.CUSTOMER) {
          return forbidden("Only customers can create bookings");
        }

        // Validate user ID matches context
        if (bookingData.userId !== userContext.id) {
          return forbidden("Cannot create booking for another user");
        }

        // Get room details
        const roomResult = await RoomRepository.getById(bookingData.roomId);
        if (!roomResult.success) {
          return fail(roomResult.error!, roomResult.statusCode);
        }
        const room = roomResult.data!;

        // Get user details
        const userResult = await UserRepository.getById(bookingData.userId);
        if (!userResult.success) {
          return fail(userResult.error!, userResult.statusCode);
        }
        const user = userResult.data!;

        // Check existing bookings for the room
        const checkOutDate = BookingService.calculateCheckOutDate(bookingData.checkInDate, bookingData.leaseType);
        const existingBookingsResult = await BookingRepository.getBookingsForRoom(
          bookingData.roomId,
          bookingData.checkInDate,
          checkOutDate
        );
        
        if (!existingBookingsResult.success) {
          return fail(existingBookingsResult.error!, existingBookingsResult.statusCode);
        }

        // Validate booking
        const validation = BookingService.validateBookingCreation(
          bookingData,
          room,
          existingBookingsResult.data
        );

        if (!validation.isValid) {
          return badRequest(validation.errors.join(", "));
        }

        // Calculate booking amounts
        const calculation = BookingService.calculateBookingAmount(
          room,
          bookingData.leaseType,
          bookingData.checkInDate
        );

        // Generate booking code
        const bookingCode = BookingService.generateBookingCode();

        // Determine payment amount based on user choice
        const isDepositPayment = bookingData.depositOption === 'deposit' && calculation.depositAmount;
        const paymentAmount = isDepositPayment ? calculation.depositAmount! : calculation.totalAmount;
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
          return internalError("Calculated payment amount is invalid");
        }
        const paymentType = isDepositPayment ? PaymentType.DEPOSIT : PaymentType.FULL;

        // Create booking with UNPAID status
        // Booking is only valid after payment is successful
        const createBookingResult = await BookingRepository.create({
          ...bookingData,
          bookingCode,
          propertyId: room.propertyId,
          checkOutDate,
          totalAmount: calculation.totalAmount,
          depositAmount: calculation.depositAmount,
          paymentStatus: PaymentStatus.PENDING,
          status: BookingStatus.UNPAID  // Changed from PENDING to UNPAID
        });

        if (!createBookingResult.success) {
          return fail(createBookingResult.error!, createBookingResult.statusCode);
        }

        const booking = createBookingResult.data!;

        // Create payment record
        const orderId = PaymentService.generateOrderId(booking.id, paymentType);
        const createPaymentResult = await PaymentRepository.create({
          bookingId: booking.id,
          userId: booking.userId,
          paymentType,
          midtransOrderId: orderId,
          amount: paymentAmount,
          status: PaymentStatus.PENDING,
          expiryTime: new Date(Date.now() + (paymentType === PaymentType.DEPOSIT ? 24 : 1) * 60 * 60 * 1000) // 24h for deposit, 1h for full
        });

        if (!createPaymentResult.success) {
          return fail(createPaymentResult.error!, createPaymentResult.statusCode);
        }

        const payment = createPaymentResult.data!;

        // Create Midtrans Snap token using adapter
        let paymentToken: string | undefined;

        try {
          const snapRequest = PaymentService.createSnapRequest(booking, payment, {
            name: user.name || undefined,
            email: user.email || undefined,
            phoneNumber: user.phoneNumber || undefined
          });

          const snapResponse = await createSnapTransaction(snapRequest);
          paymentToken = snapResponse.token;

          // Update payment with token
          await PaymentRepository.update(payment.id, {
            paymentToken
          });

        } catch (midtransError) {
          console.error("Midtrans error:", midtransError);
          const errorMessage = midtransError instanceof Error
            ? midtransError.message
            : "Failed to create payment token";
          return internalError(errorMessage);
        }

        return ok({
          booking,
          paymentToken
        });

      } catch (error) {
        console.error("Error creating booking:", error);
        return internalError("Failed to create booking");
      }
    }
  );

  /**
   * Get booking by ID
   * Accessible by booking owner, property owner, and admins
   */
  static getBooking = withAuth(
    async (userContext: UserContext, bookingId: string): Promise<Result<BookingDTO>> => {
      try {
        const bookingResult = await BookingRepository.getById(bookingId);
        if (!bookingResult.success) {
          return fail(bookingResult.error!, bookingResult.statusCode);
        }

        const booking = bookingResult.data!;

        // Check permissions
        const canAccess = 
          userContext.role === UserRole.SUPERADMIN ||
          booking.userId === userContext.id ||
          (userContext.role === UserRole.ADMINKOS && booking.property?.id); // TODO: Check if user owns the property

        if (!canAccess) {
          return forbidden("Access denied to this booking");
        }

        return ok(booking);
      } catch (error) {
        console.error("Error getting booking:", error);
        return internalError("Failed to get booking");
      }
    }
  );

  /**
   * Get paginated list of bookings
   * Accessible by all authenticated users with appropriate filters
   */
  static getBookings = withAuth(
    async (userContext: UserContext, query: BookingListQuery): Promise<Result<BookingListResponse>> => {
      try {
        // Apply role-based filters
        const filteredQuery = { ...query };

        if (userContext.role === UserRole.CUSTOMER) {
          // Customers can only see their own bookings
          filteredQuery.userId = userContext.id;
        } else if (userContext.role === UserRole.ADMINKOS) {
          // AdminKos can see bookings for their properties
          // TODO: Add propertyId filter based on user's properties
        }
        // SUPERADMIN can see all bookings

        return await BookingRepository.getList(filteredQuery);
      } catch (error) {
        console.error("Error getting bookings:", error);
        return internalError("Failed to get bookings");
      }
    }
  );

  /**
   * Update booking status
   * Accessible by property owners and admins
   */
  static updateBookingStatus = withAuth(
    async (userContext: UserContext, bookingId: string, statusData: UpdateBookingStatusDTO): Promise<Result<BookingDTO>> => {
      try {
        // Check permissions
        if (![UserRole.SUPERADMIN, UserRole.ADMINKOS, UserRole.RECEPTIONIST].includes(userContext.role)) {
          return forbidden("Access denied");
        }

        // Get current booking
        const bookingResult = await BookingRepository.getById(bookingId);
        if (!bookingResult.success) {
          return fail(bookingResult.error!, bookingResult.statusCode);
        }

        const currentBooking = bookingResult.data!;

        // Validate status transition
        if (!BookingService.validateStatusTransition(currentBooking.status, statusData.status)) {
          return badRequest(`Invalid status transition from ${currentBooking.status} to ${statusData.status}`);
        }

        // Update booking status
        return await BookingRepository.updateStatus(bookingId, statusData);
      } catch (error) {
        console.error("Error updating booking status:", error);
        return internalError("Failed to update booking status");
      }
    }
  );

  /**
   * Create full payment for booking with deposit
   * Accessible by booking owner
   */
  static createFullPayment = withAuth(
    async (userContext: UserContext, bookingId: string): Promise<Result<{ payment: PaymentDTO; paymentToken: string }>> => {
      try {
        // Get booking
        const bookingResult = await BookingRepository.getById(bookingId);
        if (!bookingResult.success) {
          return fail(bookingResult.error!, bookingResult.statusCode);
        }

        const booking = bookingResult.data!;

        // Check permissions
        if (userContext.role !== UserRole.CUSTOMER || booking.userId !== userContext.id) {
          return forbidden("Access denied");
        }

        // Check if booking is eligible for full payment
        if (booking.status !== BookingStatus.DEPOSIT_PAID) {
          return badRequest("Booking must have deposit paid to create full payment");
        }

        // Calculate remaining amount
        const remainingAmount = PaymentService.calculatePaymentAmount(booking, PaymentType.FULL);
        
        if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
          return badRequest("No remaining amount to pay");
        }

        // Create payment record
        const orderId = PaymentService.generateOrderId(booking.id, PaymentType.FULL);
        const createPaymentResult = await PaymentRepository.create({
          bookingId: booking.id,
          userId: booking.userId,
          paymentType: PaymentType.FULL,
          midtransOrderId: orderId,
          amount: remainingAmount,
          status: PaymentStatus.PENDING,
          expiryTime: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
        });

        if (!createPaymentResult.success) {
          return fail(createPaymentResult.error!, createPaymentResult.statusCode);
        }

        const payment = createPaymentResult.data!;

        // Get user details
        const userResult = await UserRepository.getById(booking.userId);
        if (!userResult.success) {
          return fail(userResult.error!, userResult.statusCode);
        }

        // Create Midtrans Snap token using adapter
        try {
          const userData = userResult.data!;
          const snapRequest = PaymentService.createSnapRequest(booking, payment, {
            name: userData.name || undefined,
            email: userData.email || undefined,
            phoneNumber: userData.phoneNumber || undefined
          });

          const snapResponse = await createSnapTransaction(snapRequest);

          // Update payment with token
          await PaymentRepository.update(payment.id, {
            paymentToken: snapResponse.token
          });

          return ok({
            payment,
            paymentToken: snapResponse.token
          });

        } catch (midtransError) {
          console.error("Midtrans error:", midtransError);
          const errorMessage = midtransError instanceof Error
            ? midtransError.message
            : "Failed to create payment token";
          return internalError(errorMessage);
        }

      } catch (error) {
        console.error("Error creating full payment:", error);
        return internalError("Failed to create full payment");
      }
    }
  );

  /**
   * Handle Midtrans notification webhook
   * Public endpoint with signature verification
   */
  static handleMidtransNotification = async (notification: MidtransNotification): Promise<Result<void>> => {
    try {
      // Validate notification
      const validation = PaymentService.validateNotification(notification);
      if (!validation.isValid) {
        return badRequest(validation.errors.join(", "));
      }

      // Verify signature
      const serverKey = process.env.MIDTRANS_SERVER_KEY!;
      if (!PaymentService.verifySignature(notification, serverKey)) {
        return badRequest("Invalid signature");
      }

      // Get payment by order ID
      const paymentResult = await PaymentRepository.getByOrderId(notification.order_id);
      if (!paymentResult.success) {
        return fail(paymentResult.error!, paymentResult.statusCode);
      }

      const payment = paymentResult.data!;

      // Map transaction status
      const newStatus = PaymentService.mapTransactionStatus(
        notification.transaction_status,
        notification.fraud_status
      );

      // Update payment
      const updateData: any = {
        status: newStatus,
        paymentMethod: notification.payment_type,
        transactionId: notification.transaction_id,
        transactionTime: new Date(notification.transaction_time)
      };

      if (notification.settlement_time) {
        updateData.transactionTime = new Date(notification.settlement_time);
      }

      if (notification.expiry_time) {
        updateData.expiryTime = new Date(notification.expiry_time);
      }

      await PaymentRepository.updateByOrderId(notification.order_id, updateData);

      // Update booking status based on payment status
      const bookingResult = await BookingRepository.getById(payment.bookingId);
      if (bookingResult.success) {
        const booking = bookingResult.data!;
        let newBookingStatus: BookingStatus | null = null;

        if (newStatus === PaymentStatus.SUCCESS) {
          // Payment successful - update from UNPAID to DEPOSIT_PAID or CONFIRMED
          if (payment.paymentType === PaymentType.DEPOSIT) {
            newBookingStatus = BookingStatus.DEPOSIT_PAID;
          } else {
            newBookingStatus = BookingStatus.CONFIRMED;
          }
        } else if (newStatus === PaymentStatus.EXPIRED || newStatus === PaymentStatus.FAILED) {
          // Payment failed/expired - mark booking as EXPIRED if still UNPAID
          if (booking.status === BookingStatus.UNPAID) {
            newBookingStatus = BookingStatus.EXPIRED;
          }
        }

        // Update booking status if changed
        if (newBookingStatus) {
          await BookingRepository.updateStatus(booking.id, { status: newBookingStatus });
        }
      }

      return ok(undefined);
    } catch (error) {
      console.error("Error handling Midtrans notification:", error);
      return internalError("Failed to handle notification");
    }
  };
}
