import { NextRequest, NextResponse } from "next/server";
import { PaymentAPI } from "@/server/api/payment.api";
import { PaymentService } from "@/server/services/payment.service";
import { verifyNotificationSignature } from "@/server/adapters/midtrans";
import type { MidtransNotification } from "@/server/types/booking";

/**
 * POST /api/midtrans/notify
 * Webhook endpoint for Midtrans payment notifications
 * 
 * This endpoint receives payment status updates from Midtrans.
 * It verifies the signature and updates the payment and booking status.
 * 
 * Midtrans will send notifications for:
 * - settlement (payment successful)
 * - pending (payment pending)
 * - deny (payment denied)
 * - cancel (payment cancelled)
 * - expire (payment expired)
 * 
 * Request body (from Midtrans):
 * {
 *   "order_id": "string",
 *   "status_code": "string",
 *   "gross_amount": "string",
 *   "signature_key": "string",
 *   "transaction_status": "string",
 *   "transaction_time": "string",
 *   "transaction_id": "string",
 *   "payment_type": "string",
 *   "fraud_status": "string" (optional)
 * }
 * 
 * Response (must be 200 for Midtrans):
 * {
 *   "success": true,
 *   "message": "Notification received"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse notification payload
    const notification: MidtransNotification = await request.json();

    console.log("🔔 ========================================");
    console.log("🔔 MIDTRANS NOTIFICATION RECEIVED");
    console.log("🔔 ========================================");
    console.log("📦 Full payload:", JSON.stringify(notification, null, 2));
    console.log("🔑 Order ID:", notification.order_id);
    console.log("📊 Transaction Status:", notification.transaction_status);
    console.log("💳 Payment Type:", notification.payment_type);
    console.log("💰 Gross Amount:", notification.gross_amount);
    console.log("🔐 Signature Key:", notification.signature_key?.substring(0, 20) + "...");
    console.log("🔔 ========================================");

    // Validate required fields
    const validation = PaymentService.validateNotification(notification);
    if (!validation.isValid) {
      console.error("❌ Invalid Midtrans notification:", validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid notification",
          details: validation.errors
        },
        { status: 400 }
      );
    }

    console.log("✅ Notification validation passed");

    // Verify signature
    console.log("🔐 Verifying signature...");
    const isSignatureValid = verifyNotificationSignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      notification.signature_key
    );

    if (!isSignatureValid) {
      console.error("❌ Invalid Midtrans signature for order:", notification.order_id);
      console.error("❌ Signature verification failed!");
      console.error("❌ Expected signature calculation:");
      console.error(`   SHA512(${notification.order_id} + ${notification.status_code} + ${notification.gross_amount} + SERVER_KEY)`);

      // Return 200 to prevent Midtrans from retrying
      // Invalid signature means potential security issue, log and ignore
      return NextResponse.json(
        {
          success: false,
          error: "Invalid signature"
        },
        { status: 200 }
      );
    }

    console.log("✅ Signature verification passed");

    // Process payment confirmation
    console.log("💾 Processing payment confirmation...");
    const result = await PaymentAPI.confirmPayment({
      orderId: notification.order_id,
      midtrans: {
        transaction_status: notification.transaction_status,
        payment_type: notification.payment_type,
        transaction_time: notification.transaction_time,
        transaction_id: notification.transaction_id,
        fraud_status: notification.fraud_status
      }
    });

    if (!result.success) {
      console.error("❌ Failed to confirm payment:", result.error);
      console.error("❌ Error details:", result);
      // Still return 200 to Midtrans to prevent retries
      // But log the error for investigation
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: "Notification received but processing failed"
        },
        { status: 200 }
      );
    }

    console.log("✅ ========================================");
    console.log("✅ PAYMENT CONFIRMED SUCCESSFULLY");
    console.log("✅ ========================================");
    console.log("📦 Order ID:", notification.order_id);
    console.log("💳 Payment Status:", result.data!.payment.status);
    console.log("📋 Booking Status:", result.data!.booking.status);
    console.log("💰 Amount:", result.data!.payment.amount);
    console.log("🔑 Payment Method:", result.data!.payment.paymentMethod);
    console.log("✅ ========================================");

    // Return 200 to Midtrans (required)
    return NextResponse.json({
      success: true,
      message: "Notification received and processed"
    });

  } catch (error: any) {
    console.error("POST /api/midtrans/notify error:", error);

    // Always return 200 to Midtrans to prevent retries
    // Log the error for investigation
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        message: "Notification received but processing failed"
      },
      { status: 200 }
    );
  }
}

