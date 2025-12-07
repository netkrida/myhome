import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { PaymentAPI } from "@/server/api/payment.api";

/**
 * POST /api/payments/confirm-client
 * Confirm payment from client-side Snap callback
 * 
 * This is a fallback mechanism when webhook is delayed.
 * When Midtrans Snap returns onSuccess callback, client can call this
 * to update payment status immediately.
 * 
 * This endpoint requires authentication to prevent abuse.
 * 
 * Request body:
 * {
 *   "orderId": "FULL-XXXXX-XXXXXX",
 *   "transactionStatus": "settlement" | "capture" | "pending",
 *   "paymentType": "credit_card" | "bank_transfer" | etc,
 *   "transactionTime": "2025-12-07 10:00:00",
 *   "transactionId": "xxx-xxx-xxx"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, transactionStatus, paymentType, transactionTime, transactionId } = body;

    console.log("🔄 ========================================");
    console.log("🔄 CLIENT PAYMENT CONFIRMATION");
    console.log("🔄 ========================================");
    console.log("🔑 Order ID:", orderId);
    console.log("📊 Transaction Status:", transactionStatus);
    console.log("💳 Payment Type:", paymentType);
    console.log("👤 User ID:", session.user.id);
    console.log("🔄 ========================================");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Only process successful transactions
    if (!["settlement", "capture"].includes(transactionStatus)) {
      console.log("⏳ Transaction not yet settled, skipping client confirmation");
      return NextResponse.json({
        success: true,
        data: {
          status: "pending",
          message: "Payment is still pending, waiting for webhook confirmation"
        }
      });
    }

    // Use PaymentAPI to confirm the payment
    const result = await PaymentAPI.confirmPayment({
      orderId,
      midtrans: {
        transaction_status: transactionStatus,
        payment_type: paymentType,
        transaction_time: transactionTime,
        transaction_id: transactionId,
        fraud_status: "accept" // Client callback only fires for successful payments
      }
    });

    if (!result.success) {
      console.error("❌ Failed to confirm payment from client:", result.error);
      // Don't expose internal errors to client
      return NextResponse.json({
        success: false,
        error: "Failed to confirm payment"
      }, { status: 500 });
    }

    console.log("✅ Payment confirmed from client callback");

    return NextResponse.json({
      success: true,
      data: {
        status: "success",
        message: "Payment confirmed successfully"
      }
    });

  } catch (error: any) {
    console.error("❌ Error confirming payment from client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
