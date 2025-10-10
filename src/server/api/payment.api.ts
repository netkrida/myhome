import { BookingRepository } from "../repositories/booking.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { UserRepository } from "../repositories/user.repository";
import { PaymentService } from "../services/payment.service";
import { createSnapTransaction } from "../adapters/midtrans";
import { prisma } from "../db/client";
import { withAuth } from "../lib/auth";
import { UserRole } from "../types/rbac";
import type { UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import { ok, fail, notFound, forbidden, internalError, badRequest } from "../types/result";
import type {
  PaymentDTO,
  BookingDTO,
  MidtransNotification,
  PaymentType,
  BookingStatus,
  PaymentStatus
} from "../types/booking";

/**
 * Tier-2: Payment Application Service
 * Orchestrates payment operations between domain services, repositories, and adapters
 */
export class PaymentAPI {

  /**
   * Create payment token for a booking
   * Accessible by booking owner or admin
   */
  static createPaymentToken = withAuth(
    async (
      userContext: UserContext,
      input: { bookingId: string; type: PaymentType }
    ): Promise<Result<{ token: string; redirectUrl: string; orderId: string }>> => {
      try {
        const { bookingId, type: paymentType } = input;

        // Get booking with details
        const bookingResult = await BookingRepository.getById(bookingId);
        if (!bookingResult.success) {
          return fail(bookingResult.error!, bookingResult.statusCode);
        }

        const booking = bookingResult.data!;

        // Check permissions: only booking owner or admin can create payment
        const isOwner = booking.userId === userContext.id;
        const isAdmin = [UserRole.SUPERADMIN, UserRole.ADMINKOS, UserRole.RECEPTIONIST].includes(userContext.role);
        
        if (!isOwner && !isAdmin) {
          return forbidden("You don't have permission to create payment for this booking");
        }

        // Calculate payment amount
        const amount = PaymentService.calculatePaymentAmount(booking, paymentType);
        if (amount <= 0) {
          return badRequest("Invalid payment amount");
        }

        // Generate unique order ID
        const orderId = PaymentService.generateOrderId(booking.id, paymentType);

        // Create payment record (PENDING)
        const createPaymentResult = await PaymentRepository.create({
          bookingId: booking.id,
          userId: booking.userId,
          paymentType,
          midtransOrderId: orderId,
          amount,
          status: "PENDING" as PaymentStatus,
          expiryTime: new Date(Date.now() + (paymentType === "DEPOSIT" ? 24 : 1) * 60 * 60 * 1000)
        });

        if (!createPaymentResult.success) {
          return fail(createPaymentResult.error!, createPaymentResult.statusCode);
        }

        const payment = createPaymentResult.data!;

        // Get user details for Midtrans
        const userResult = await UserRepository.getById(booking.userId);
        if (!userResult.success) {
          return fail(userResult.error!, userResult.statusCode);
        }

        const user = userResult.data!;

        // Create Snap request
        const snapRequest = PaymentService.createSnapRequest(booking, payment, {
          name: user.name || undefined,
          email: user.email || undefined,
          phoneNumber: user.phoneNumber || undefined
        });

        console.log("🔵 Creating payment token:", {
          orderId,
          bookingId: booking.id,
          paymentType,
          amount
        });

        console.log("🔵 Snap request:", {
          orderId: snapRequest.transaction_details.order_id,
          amount: snapRequest.transaction_details.gross_amount,
          customerEmail: snapRequest.customer_details?.email
        });

        // Call Midtrans to create Snap transaction
        // Note: Redirect URLs are set in Midtrans Dashboard Settings
        // We use localStorage to pass orderId to success page
        const snapResponse = await createSnapTransaction(snapRequest);

        console.log("✅ Snap transaction created:", {
          orderId,
          token: snapResponse.token.substring(0, 20) + "...",
          redirectUrl: snapResponse.redirect_url
        });

        // Save payment token
        await PaymentRepository.saveToken(
          orderId,
          snapResponse.token,
          payment.expiryTime || undefined
        );

        return ok({
          token: snapResponse.token,
          redirectUrl: snapResponse.redirect_url,
          orderId
        });

      } catch (error: any) {
        console.error("Error creating payment token:", error);
        return internalError(error.message || "Failed to create payment token");
      }
    }
  );

  /**
   * Confirm payment from Midtrans notification
   * This is called by Midtrans webhook
   */
  static async confirmPayment(
    input: {
      orderId: string;
      midtrans: {
        transaction_status: string;
        payment_type?: string;
        transaction_time?: string;
        transaction_id?: string;
        fraud_status?: string;
      };
    }
  ): Promise<Result<{ payment: PaymentDTO; booking: BookingDTO }>> {
    try {
      const { orderId, midtrans } = input;

      console.log("🔄 confirmPayment called:", {
        orderId,
        transactionStatus: midtrans.transaction_status,
        paymentType: midtrans.payment_type,
        transactionTime: midtrans.transaction_time,
        transactionId: midtrans.transaction_id
      });

      // Get payment with booking
      console.log("🔍 Finding payment by order ID:", orderId);
      const paymentResult = await PaymentRepository.findByOrderIdWithBooking(orderId);
      if (!paymentResult.success) {
        console.error("❌ Payment not found:", orderId);
        return fail(paymentResult.error!, paymentResult.statusCode);
      }

      console.log("✅ Payment found:", {
        paymentId: paymentResult.data!.id,
        currentStatus: (paymentResult.data! as PaymentDTO).status,
        bookingId: (paymentResult.data! as any).booking.id
      });

      const paymentData = paymentResult.data!;
      const existingPayment = paymentData as PaymentDTO;
      const existingBooking = (paymentData as any).booking;

      // Check if payment is already processed (idempotency)
      if (existingPayment.status !== "PENDING") {
        console.log(`⚠️ Payment ${orderId} already processed with status: ${existingPayment.status}`);
        console.log("⚠️ Idempotency check - returning existing data");
        return ok({
          payment: existingPayment,
          booking: existingBooking
        });
      }

      // Map Midtrans status to our PaymentStatus
      console.log("🔄 Mapping transaction status:", midtrans.transaction_status);
      const newPaymentStatus = PaymentService.mapTransactionStatus(
        midtrans.transaction_status,
        midtrans.fraud_status
      );
      console.log("✅ Mapped to payment status:", newPaymentStatus);

      // Determine new booking status based on payment status and type
      let newBookingStatus: BookingStatus = existingBooking.status;
      let newBookingPaymentStatus: PaymentStatus = newPaymentStatus;

      console.log("🔄 Determining booking status...");
      console.log("   Current booking status:", existingBooking.status);
      console.log("   Payment type:", existingPayment.paymentType);
      console.log("   New payment status:", newPaymentStatus);

      if (newPaymentStatus === "SUCCESS") {
        // Payment successful
        if (existingPayment.paymentType === "DEPOSIT") {
          newBookingStatus = "DEPOSIT_PAID" as BookingStatus;
          console.log("   → Booking status will be: DEPOSIT_PAID");
        } else if (existingPayment.paymentType === "FULL") {
          newBookingStatus = "CONFIRMED" as BookingStatus;
          console.log("   → Booking status will be: CONFIRMED");
        }
      } else if (newPaymentStatus === "FAILED") {
        // Payment failed - keep booking as UNPAID or set to CANCELLED
        newBookingStatus = "UNPAID" as BookingStatus;
        console.log("   → Booking status will be: UNPAID");
      } else if (newPaymentStatus === "EXPIRED") {
        // Payment expired - set booking to EXPIRED
        newBookingStatus = "EXPIRED" as BookingStatus;
        console.log("   → Booking status will be: EXPIRED");
      }

      // Update payment and booking in a transaction
      console.log("💾 Starting database transaction...");
      const result = await prisma.$transaction(async (tx) => {
        console.log("   📝 Updating payment record...");
        // Update payment
        const updatedPayment = await tx.payment.update({
          where: { midtransOrderId: orderId },
          data: {
            status: newPaymentStatus,
            paymentMethod: midtrans.payment_type,
            transactionTime: PaymentService.parseMidtransDateTime(midtrans.transaction_time),
            transactionId: midtrans.transaction_id
          }
        });
        console.log("   ✅ Payment updated:", {
          id: updatedPayment.id,
          status: updatedPayment.status,
          paymentMethod: updatedPayment.paymentMethod,
          transactionId: updatedPayment.transactionId
        });

        // Trigger ledger synchronization hook if payment is successful
        if (newPaymentStatus === "SUCCESS") {
          try {
            const { PaymentHooks } = await import("../api/hooks/payment.hooks");
            await PaymentHooks.onPaymentSuccess(updatedPayment.id);
          } catch (error) {
            console.warn("Failed to sync payment to ledger:", error);
            // Don't fail the payment confirmation if ledger sync fails
          }
        }

        console.log("   📝 Updating booking record...");
        // Update booking
        const updatedBooking = await tx.booking.update({
          where: { id: existingPayment.bookingId },
          data: {
            paymentStatus: newBookingPaymentStatus,
            status: newBookingStatus
          },
          include: {
            user: true,
            property: true,
            room: true,
            payments: true
          }
        });
        console.log("   ✅ Booking updated:", {
          id: updatedBooking.id,
          status: updatedBooking.status,
          paymentStatus: updatedBooking.paymentStatus
        });

        return { payment: updatedPayment, booking: updatedBooking };
      });

      console.log("✅ Database transaction completed successfully");

      // Map to DTOs
      const paymentDTO: PaymentDTO = {
        id: result.payment.id,
        bookingId: result.payment.bookingId,
        userId: result.payment.userId,
        midtransOrderId: result.payment.midtransOrderId,
        paymentType: result.payment.paymentType as PaymentType,
        paymentMethod: result.payment.paymentMethod || undefined,
        amount: Number(result.payment.amount),
        status: result.payment.status as PaymentStatus,
        transactionTime: result.payment.transactionTime || undefined,
        transactionId: result.payment.transactionId || undefined,
        paymentToken: result.payment.paymentToken || undefined,
        expiryTime: result.payment.expiryTime || undefined,
        createdAt: result.payment.createdAt,
        updatedAt: result.payment.updatedAt
      };

      const bookingDTO: BookingDTO = {
        id: result.booking.id,
        bookingCode: result.booking.bookingCode,
        userId: result.booking.userId,
        propertyId: result.booking.propertyId,
        roomId: result.booking.roomId,
        checkInDate: result.booking.checkInDate,
        checkOutDate: result.booking.checkOutDate || undefined,
        leaseType: result.booking.leaseType as any,
        totalAmount: Number(result.booking.totalAmount),
        depositAmount: result.booking.depositAmount ? Number(result.booking.depositAmount) : undefined,
        paymentStatus: result.booking.paymentStatus as PaymentStatus,
        status: result.booking.status as BookingStatus,
        createdAt: result.booking.createdAt,
        updatedAt: result.booking.updatedAt
      };

      return ok({ payment: paymentDTO, booking: bookingDTO });

    } catch (error: any) {
      console.error("Error confirming payment:", error);
      return internalError(error.message || "Failed to confirm payment");
    }
  }

  /**
   * Get payment status by order ID with userId validation
   * Requires authentication to ensure users can only view their own payments
   */
  static async getPaymentStatus(
    orderId: string,
    userId: string
  ): Promise<Result<{ payment: PaymentDTO; booking: BookingDTO }>> {
    try {
      console.log("🔍 PaymentAPI.getPaymentStatus - Looking up:", orderId, "for userId:", userId);

      const paymentResult = await PaymentRepository.findByOrderIdWithBooking(orderId, userId);

      // fix: discriminated union Result type - guard before accessing data/error
      console.log("🔍 PaymentAPI.getPaymentStatus - Repository result:", {
        success: paymentResult.success,
        hasData: paymentResult.success ? !!paymentResult.data : false,
        error: !paymentResult.success ? paymentResult.error : undefined
      });

      if (!paymentResult.success) {
        console.error("❌ Payment not found or unauthorized:", orderId);
        return fail(paymentResult.error, paymentResult.statusCode);
      }

      const paymentData = paymentResult.data;
      const payment = paymentData as PaymentDTO;
      const booking = (paymentData as any).booking;

      console.log("✅ Payment found:", {
        orderId,
        userId,
        paymentStatus: payment.status,
        bookingStatus: booking?.status
      });

      // Map booking to DTO
      const bookingDTO: BookingDTO = {
        id: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        propertyId: booking.propertyId,
        roomId: booking.roomId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate || undefined,
        leaseType: booking.leaseType,
        totalAmount: Number(booking.totalAmount),
        depositAmount: booking.depositAmount ? Number(booking.depositAmount) : undefined,
        paymentStatus: booking.paymentStatus as PaymentStatus,
        status: booking.status as BookingStatus,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        user: booking.user ? {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email
        } : undefined,
        property: booking.property ? {
          id: booking.property.id,
          name: booking.property.name
        } : undefined,
        room: booking.room ? {
          id: booking.room.id,
          roomNumber: booking.room.roomNumber,
          roomType: booking.room.roomType,
          monthlyPrice: Number(booking.room.monthlyPrice)
        } : undefined
      };

      return ok({ payment, booking: bookingDTO });

    } catch (error: any) {
      console.error("Error getting payment status:", error);
      return internalError(error.message || "Failed to get payment status");
    }
  }
}

