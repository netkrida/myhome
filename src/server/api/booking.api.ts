import { BookingRepository } from "../repositories/adminkos/booking.repository";
import { PaymentRepository } from "../repositories/adminkos/payment.repository";
import { RoomRepository } from "../repositories/adminkos/room.repository";
import { PropertyRepository } from "../repositories/global/property.repository";
import { UserRepository } from "../repositories/user.repository";
import { BookingService } from "../services/booking.service";
import { PaymentService } from "../services/payment.service";
import { NotificationService } from "../services/NotificationService";
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
  MidtransNotification,
  ExtendBookingDTO,
  BookingExtensionInfo
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

        // 🔔 Kirim notifikasi booking baru (async, tidak block response)
        try {
          // Get property owner details untuk notifikasi
          const propertyOwner = await PropertyRepository.getPropertyOwnerContact(room.propertyId);
          
          if (propertyOwner && propertyOwner.ownerPhoneNumber && user.phoneNumber) {
            console.log("🔔 Sending booking created notification...");
            
            NotificationService.sendBookingCreatedNotification({
              customerName: user.name || "Customer",
              customerPhone: user.phoneNumber,
              adminkosPhone: propertyOwner.ownerPhoneNumber,
              propertyName: propertyOwner.propertyName,
              bookingCode: booking.bookingCode,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate || checkOutDate,
            }).then((notifResult) => {
              if (notifResult.success) {
                console.log("✅ Booking created notification sent:", notifResult.data);
              } else {
                console.error("❌ Failed to send booking notification:", notifResult.error);
              }
            }).catch((err) => {
              console.error("❌ Error sending booking notification:", err);
            });
          } else {
            console.warn("⚠️ Cannot send booking notification - missing phone numbers:", {
              customerPhone: user.phoneNumber,
              adminkosPhone: propertyOwner?.ownerPhoneNumber,
            });
          }
        } catch (notifError) {
          // Log tapi tidak gagalkan booking
          console.error("⚠️ Error preparing booking notification:", notifError);
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
        const updateResult = await BookingRepository.updateStatus(bookingId, statusData);
        
        if (!updateResult.success) {
          return fail(updateResult.error!, updateResult.statusCode);
        }

        const updatedBooking = updateResult.data!;

        // 🔔 Kirim notifikasi check-in/check-out (async, tidak block response)
        try {
          console.log("🔍 Check notification trigger:", {
            newStatus: statusData.status,
            isCheckIn: statusData.status === BookingStatus.CHECKED_IN,
            isCheckOut: statusData.status === BookingStatus.COMPLETED,
          });

          // Hanya kirim notifikasi jika status berubah ke CHECKED_IN atau COMPLETED (check-out)
          if (statusData.status === BookingStatus.CHECKED_IN || statusData.status === BookingStatus.COMPLETED) {
            console.log("🔍 Fetching booking data for notification...");
            
            // Get full booking data with relations untuk notifikasi
            const fullBookingResult = await BookingRepository.getById(bookingId);
            console.log("🔍 Full booking result:", { 
              success: fullBookingResult.success, 
              hasData: fullBookingResult.success ? !!fullBookingResult.data : false 
            });
            
            if (fullBookingResult.success && fullBookingResult.data) {
              const fullBooking = fullBookingResult.data;
              console.log("🔍 Full booking data:", {
                id: fullBooking.id,
                userId: fullBooking.userId,
                propertyId: fullBooking.propertyId,
                bookingCode: fullBooking.bookingCode,
              });
              
              // Get user details
              const userResult = await UserRepository.getById(fullBooking.userId);
              console.log("🔍 User result:", { 
                success: userResult.success, 
                hasData: userResult.success ? !!userResult.data : false 
              });
              
              // Get property owner details
              const propertyOwner = await PropertyRepository.getPropertyOwnerContact(fullBooking.propertyId);
              console.log("🔍 Property owner result:", {
                hasData: !!propertyOwner,
                ownerPhone: propertyOwner?.ownerPhoneNumber,
                propertyName: propertyOwner?.propertyName,
              });
              
              if (userResult.success && userResult.data && propertyOwner) {
                const user = userResult.data;
                console.log("🔍 User data:", {
                  name: user.name,
                  phone: user.phoneNumber,
                });
                
                if (user.phoneNumber && propertyOwner.ownerPhoneNumber) {
                  if (statusData.status === BookingStatus.CHECKED_IN) {
                    console.log("🔔 Sending check-in notification...");
                    
                    NotificationService.sendCheckInNotification({
                      customerName: user.name || "Customer",
                      customerPhone: user.phoneNumber,
                      adminkosPhone: propertyOwner.ownerPhoneNumber,
                      propertyName: propertyOwner.propertyName,
                      bookingCode: fullBooking.bookingCode,
                      checkInDate: fullBooking.checkInDate,
                    }).then((notifResult) => {
                      if (notifResult.success) {
                        console.log("✅ Check-in notification sent:", notifResult.data);
                      } else {
                        console.error("❌ Failed to send check-in notification:", notifResult.error);
                      }
                    }).catch((err) => {
                      console.error("❌ Error sending check-in notification:", err);
                    });
                  } else if (statusData.status === BookingStatus.COMPLETED) {
                    console.log("🔍 Check-out condition:", {
                      hasCheckOutDate: !!fullBooking.checkOutDate,
                      checkOutDate: fullBooking.checkOutDate,
                      hasActualCheckOutAt: !!fullBooking.actualCheckOutAt,
                      actualCheckOutAt: fullBooking.actualCheckOutAt,
                    });
                    
                    // Gunakan actualCheckOutAt atau checkOutDate atau new Date() sebagai fallback
                    const checkOutDateToUse = fullBooking.actualCheckOutAt || fullBooking.checkOutDate || new Date();
                    
                    console.log("🔔 Sending check-out notification...", {
                      checkOutDate: checkOutDateToUse,
                    });
                    
                    NotificationService.sendCheckOutNotification({
                      customerName: user.name || "Customer",
                      customerPhone: user.phoneNumber,
                      adminkosPhone: propertyOwner.ownerPhoneNumber,
                      propertyName: propertyOwner.propertyName,
                      bookingCode: fullBooking.bookingCode,
                      checkOutDate: checkOutDateToUse,
                    }).then((notifResult) => {
                      if (notifResult.success) {
                        console.log("✅ Check-out notification sent:", notifResult.data);
                      } else {
                        console.error("❌ Failed to send check-out notification:", notifResult.error);
                      }
                    }).catch((err) => {
                      console.error("❌ Error sending check-out notification:", err);
                    });
                  }
                } else {
                  console.warn("⚠️ Cannot send notification - missing phone numbers:", {
                    customerPhone: user.phoneNumber,
                    adminkosPhone: propertyOwner.ownerPhoneNumber,
                  });
                }
              } else {
                console.warn("⚠️ Cannot send notification - missing data:", {
                  hasUserResult: userResult.success,
                  hasPropertyOwner: !!propertyOwner,
                });
              }
            } else {
              console.warn("⚠️ Cannot fetch full booking data for notification");
            }
          } else {
            console.log("🔍 Status not eligible for notification:", statusData.status);
          }
        } catch (notifError) {
          // Log tapi tidak gagalkan update status
          console.error("⚠️ Error preparing check-in/check-out notification:", notifError);
        }

        return updateResult;
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
        transactionTime: PaymentService.parseMidtransDateTime(notification.transaction_time)
      };

      if (notification.settlement_time) {
        updateData.transactionTime = PaymentService.parseMidtransDateTime(notification.settlement_time);
      }

      if (notification.expiry_time) {
        updateData.expiryTime = PaymentService.parseMidtransDateTime(notification.expiry_time);
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

  /**
   * Get extension info for a booking
   * Shows whether booking can be extended and estimated costs
   */
  static getExtensionInfo = withAuth(
    async (userContext: UserContext, bookingId: string): Promise<Result<BookingExtensionInfo>> => {
      try {
        // Get booking
        const bookingResult = await BookingRepository.getById(bookingId);
        if (!bookingResult.success) {
          return fail(bookingResult.error!, bookingResult.statusCode);
        }

        const booking = bookingResult.data!;

        // Check permissions - only booking owner can extend
        if (userContext.role !== UserRole.CUSTOMER || booking.userId !== userContext.id) {
          return forbidden("Access denied");
        }

        // Check if booking is eligible for extension
        const eligibleStatuses: (typeof BookingStatus[keyof typeof BookingStatus])[] = [
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
          BookingStatus.DEPOSIT_PAID
        ];
        if (!eligibleStatuses.includes(booking.status)) {
          return badRequest("Booking tidak dapat diperpanjang. Status harus CONFIRMED, CHECKED_IN, atau DEPOSIT_PAID");
        }

        // Get room details for pricing
        const roomResult = await RoomRepository.getById(booking.roomId);
        if (!roomResult.success) {
          return fail(roomResult.error!, roomResult.statusCode);
        }

        const room = roomResult.data!;

        // Calculate new check-out date and price for 1 period extension
        const currentCheckOutDate = booking.checkOutDate || new Date();
        const newCheckOutDate = BookingService.calculateCheckOutDate(currentCheckOutDate, booking.leaseType);
        
        // Calculate price for extension
        const extensionCalculation = BookingService.calculateBookingAmount(
          room,
          booking.leaseType,
          currentCheckOutDate
        );

        // Check room availability for extended period
        const existingBookingsResult = await BookingRepository.getBookingsForRoom(
          booking.roomId,
          currentCheckOutDate,
          newCheckOutDate
        );

        let isAvailable = true;
        if (existingBookingsResult.success && existingBookingsResult.data) {
          // Exclude current booking from conflict check
          const conflictingBookings = existingBookingsResult.data.filter(b => b.id !== booking.id);
          isAvailable = conflictingBookings.length === 0;
        }

        return ok({
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          currentCheckOutDate,
          newCheckOutDate,
          leaseType: booking.leaseType,
          extensionAmount: extensionCalculation.totalAmount,
          depositAmount: extensionCalculation.depositAmount,
          isEligible: isAvailable,
          reason: isAvailable ? undefined : "Kamar sudah dipesan untuk periode tersebut",
          room: {
            id: room.id,
            roomNumber: room.roomNumber,
            roomType: room.roomType
          },
          property: booking.property ? {
            id: booking.property.id,
            name: booking.property.name
          } : undefined
        });

      } catch (error) {
        console.error("Error getting extension info:", error);
        return internalError("Failed to get extension info");
      }
    }
  );

  /**
   * Extend booking for next period
   * Creates a new booking (linked) for the extended period
   */
  static extendBooking = withAuth(
    async (userContext: UserContext, bookingId: string, extensionData: ExtendBookingDTO): Promise<Result<{ booking: BookingDTO; paymentToken?: string }>> => {
      try {
        // Get original booking
        const bookingResult = await BookingRepository.getById(bookingId);
        if (!bookingResult.success) {
          return fail(bookingResult.error!, bookingResult.statusCode);
        }

        const originalBooking = bookingResult.data!;

        // Check permissions - only booking owner can extend
        if (userContext.role !== UserRole.CUSTOMER || originalBooking.userId !== userContext.id) {
          return forbidden("Access denied");
        }

        // Check if booking is eligible for extension
        const eligibleStatuses2: (typeof BookingStatus[keyof typeof BookingStatus])[] = [
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
          BookingStatus.DEPOSIT_PAID
        ];
        if (!eligibleStatuses2.includes(originalBooking.status)) {
          return badRequest("Booking tidak dapat diperpanjang. Status harus CONFIRMED, CHECKED_IN, atau DEPOSIT_PAID");
        }

        // Get room details
        const roomResult = await RoomRepository.getById(originalBooking.roomId);
        if (!roomResult.success) {
          return fail(roomResult.error!, roomResult.statusCode);
        }
        const room = roomResult.data!;

        // Get user details
        const userResult = await UserRepository.getById(originalBooking.userId);
        if (!userResult.success) {
          return fail(userResult.error!, userResult.statusCode);
        }
        const user = userResult.data!;

        // Determine lease type (use provided or original)
        const leaseType = extensionData.leaseType || originalBooking.leaseType;
        const periods = extensionData.periods || 1;

        // Calculate new dates
        const currentCheckOutDate = originalBooking.checkOutDate || new Date();
        let newCheckInDate = new Date(currentCheckOutDate);
        let newCheckOutDate = new Date(currentCheckOutDate);

        // Calculate check-out date based on periods
        for (let i = 0; i < periods; i++) {
          newCheckOutDate = BookingService.calculateCheckOutDate(newCheckOutDate, leaseType);
        }

        // Check for conflicting bookings
        const existingBookingsResult = await BookingRepository.getBookingsForRoom(
          originalBooking.roomId,
          newCheckInDate,
          newCheckOutDate
        );

        if (existingBookingsResult.success && existingBookingsResult.data) {
          const conflictingBookings = existingBookingsResult.data.filter(b => b.id !== originalBooking.id);
          if (conflictingBookings.length > 0) {
            return badRequest("Kamar sudah dipesan untuk periode tersebut");
          }
        }

        // Calculate booking amounts
        let totalAmount = 0;
        for (let i = 0; i < periods; i++) {
          const calculation = BookingService.calculateBookingAmount(
            room,
            leaseType,
            newCheckInDate
          );
          totalAmount += calculation.totalAmount;
        }

        // Generate new booking code
        const bookingCode = BookingService.generateBookingCode();

        // Determine payment amount
        const isDepositPayment = extensionData.depositOption === 'deposit';
        const depositAmount = isDepositPayment ? Math.round(totalAmount * 0.3) : undefined; // 30% deposit
        const paymentAmount = isDepositPayment && depositAmount ? depositAmount : totalAmount;
        const paymentType = isDepositPayment ? PaymentType.DEPOSIT : PaymentType.FULL;

        // Create new booking for extension
        const createBookingResult = await BookingRepository.create({
          userId: originalBooking.userId,
          roomId: originalBooking.roomId,
          bookingCode,
          propertyId: room.propertyId,
          checkInDate: newCheckInDate,
          checkOutDate: newCheckOutDate,
          leaseType,
          depositOption: isDepositPayment ? 'deposit' : 'full',
          totalAmount,
          depositAmount,
          paymentStatus: PaymentStatus.PENDING,
          status: BookingStatus.UNPAID
          // Note: parentBookingId not in schema yet - can be added later for tracking extensions
        });

        if (!createBookingResult.success) {
          return fail(createBookingResult.error!, createBookingResult.statusCode);
        }

        const newBooking = createBookingResult.data!;

        // Create payment record
        const orderId = PaymentService.generateOrderId(newBooking.id, paymentType);
        const createPaymentResult = await PaymentRepository.create({
          bookingId: newBooking.id,
          userId: newBooking.userId,
          paymentType,
          midtransOrderId: orderId,
          amount: paymentAmount,
          status: PaymentStatus.PENDING,
          expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        if (!createPaymentResult.success) {
          return fail(createPaymentResult.error!, createPaymentResult.statusCode);
        }

        const payment = createPaymentResult.data!;

        // Create Midtrans Snap token
        let paymentToken: string | undefined;

        try {
          const snapRequest = PaymentService.createSnapRequest(newBooking, payment, {
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
          booking: newBooking,
          paymentToken
        });

      } catch (error) {
        console.error("Error extending booking:", error);
        return internalError("Failed to extend booking");
      }
    }
  );
}
