import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { PaymentRepository } from "@/server/repositories/payment.repository";

/**
 * GET /api/payments/[paymentId]
 * Get payment details by payment ID (UUID)
 *
 * This endpoint is used for ledger integration where refId is the payment.id
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "payment": { ... },
 *     "booking": { ... }
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    // Get current user session
    const session = await auth();

    if (!session?.user?.id) {
      console.error("❌ Unauthorized - No session");
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const paymentId = params.paymentId;

    console.log("🔍 GET /api/payments/[paymentId] - Request:", { 
      paymentId, 
      userId, 
      userRole 
    });

    if (!paymentId) {
      console.error("❌ Payment ID is required");
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get payment by ID with booking details
    console.log("🔍 Fetching payment by ID:", paymentId);
    const result = await PaymentRepository.findByIdWithBooking(paymentId);

    console.log("🔍 Payment result:", {
      success: result.success,
      hasData: result.success ? !!result.data : false,
      error: !result.success ? result.error : undefined,
    });

    if (!result.success) {
      console.error("❌ Failed to get payment:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error.message || "Payment not found",
        },
        { status: result.statusCode }
      );
    }

    const paymentData = result.data as any;

    // Check authorization - user must be either:
    // 1. The booking customer
    // 2. Admin of the property
    const booking = paymentData.booking;
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found for this payment" },
        { status: 404 }
      );
    }

    // Authorization logic:
    // 1. SUPERADMIN: Can access all payments
    // 2. ADMINKOS: Can access payments for their properties (property.ownerId)
    // 3. CUSTOMER: Can access their own booking payments
    const isSuperAdmin = userRole === "SUPERADMIN";
    const isCustomer = booking.userId === userId;
    const isPropertyOwner = booking.property?.ownerId === userId;
    const isAdminKosRole = userRole === "ADMINKOS";

    console.log("🔐 Authorization check:", {
      userId,
      userRole,
      bookingUserId: booking.userId,
      propertyId: booking.property?.id,
      propertyOwnerId: booking.property?.ownerId,
      isCustomer,
      isPropertyOwner,
      isAdminKosRole,
      isSuperAdmin,
      hasProperty: !!booking.property
    });

    // Authorization rules:
    // - SUPERADMIN can access any payment
    // - Property owner (ownerId matches) can access payments for their properties
    // - Customer can access their own booking payments
    const isAuthorized = isSuperAdmin || isPropertyOwner || isCustomer;

    if (!isAuthorized) {
      console.error("❌ Unauthorized - User cannot access this payment", {
        userId,
        userRole,
        bookingUserId: booking.userId,
        propertyOwnerId: booking.property?.ownerId,
        reason: "User is not the customer, property owner, or superadmin"
      });
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to view this payment",
        },
        { status: 403 }
      );
    }

    console.log("✅ Payment retrieved successfully", {
      paymentId,
      authorizedAs: isSuperAdmin ? "SUPERADMIN" : isPropertyOwner ? "PROPERTY_OWNER" : "CUSTOMER"
    });
    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: paymentData.id,
          midtransOrderId: paymentData.midtransOrderId,
          paymentType: paymentData.paymentType,
          amount: Number(paymentData.amount),
          status: paymentData.status,
          paymentMethod: paymentData.paymentMethod,
          transactionTime: paymentData.transactionTime,
          transactionId: paymentData.transactionId,
          createdAt: paymentData.createdAt,
          updatedAt: paymentData.updatedAt,
        },
        booking: {
          id: booking.id,
          bookingCode: booking.bookingCode,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalAmount: Number(booking.totalAmount),
          depositAmount: booking.depositAmount ? Number(booking.depositAmount) : undefined,
          property: booking.property
            ? {
                name: booking.property.name,
              }
            : undefined,
          room: booking.room
            ? {
                roomNumber: booking.room.roomNumber,
                roomType: booking.room.roomType,
              }
            : undefined,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ GET /api/payments/[paymentId] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
