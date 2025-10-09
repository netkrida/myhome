import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { PaymentAPI } from "@/server/api/payment.api";

/**
 * GET /api/payments/status?orderId=xxx
 * Get payment status by order ID
 *
 * This endpoint requires authentication to ensure users can only view their own payments
 *
 * Query params:
 * - orderId: Midtrans order ID
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
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");

    console.log("🔍 GET /api/payments/status - Request:", { orderId, userId });

    if (!orderId) {
      console.error("❌ Order ID is required");
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get payment status with userId validation
    console.log("🔍 Fetching payment status for:", orderId, "userId:", userId);
    const result = await PaymentAPI.getPaymentStatus(orderId, userId);

    // fix: discriminated union Result type - guard before accessing data/error
    console.log("🔍 Payment status result:", {
      success: result.success,
      hasData: result.success ? !!result.data : false,
      error: !result.success ? result.error : undefined,
      statusCode: result.success ? result.statusCode : result.statusCode
    });

    if (!result.success) {
      console.error("❌ Failed to get payment status:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error.message || 'Failed to get payment status'
        },
        { status: result.statusCode }
      );
    }

    console.log("✅ Payment status retrieved successfully");
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: any) {
    console.error("❌ GET /api/payments/status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

