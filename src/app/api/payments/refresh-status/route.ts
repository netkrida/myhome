import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { getTransactionStatus } from "@/server/adapters/midtrans";
import { PaymentAPI } from "@/server/api/payment.api";

/**
 * POST /api/payments/refresh-status
 * Manually refresh payment status from Midtrans
 * 
 * This is useful when webhook notification is delayed or missed.
 * It queries Midtrans API directly to get the current status.
 * 
 * Request body:
 * {
 *   "orderId": "string"  // Midtrans order ID
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "previousStatus": "PENDING",
 *     "currentStatus": "SUCCESS",
 *     "updated": true
 *   }
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    console.log("🔄 Refreshing payment status from Midtrans:", orderId);

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: {
        midtransOrderId: orderId,
        userId: session.user.id, // Ensure user owns this payment
      },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    const previousStatus = payment.status;

    // If already SUCCESS, no need to refresh
    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        data: {
          previousStatus,
          currentStatus: "SUCCESS",
          updated: false,
          message: "Payment already successful",
        },
      });
    }

    // Query Midtrans for current status
    console.log("🔍 Querying Midtrans API for status...");
    const midtransStatus = await getTransactionStatus(orderId);

    console.log("📦 Midtrans response:", JSON.stringify(midtransStatus, null, 2));

    if (!midtransStatus || midtransStatus.status_code === "404") {
      return NextResponse.json({
        success: false,
        error: "Transaction not found in Midtrans",
      }, { status: 404 });
    }

    // Map Midtrans status to our status
    const transactionStatus = midtransStatus.transaction_status;
    let newStatus: string = payment.status;
    let shouldUpdate = false;

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      // Check fraud status for credit card
      if (midtransStatus.fraud_status === "accept" || !midtransStatus.fraud_status) {
        newStatus = "SUCCESS";
        shouldUpdate = true;
      }
    } else if (transactionStatus === "pending") {
      newStatus = "PENDING";
    } else if (transactionStatus === "deny" || transactionStatus === "cancel") {
      newStatus = "FAILED";
      shouldUpdate = previousStatus !== "FAILED";
    } else if (transactionStatus === "expire") {
      newStatus = "EXPIRED";
      shouldUpdate = previousStatus !== "EXPIRED";
    }

    // If status changed, use PaymentAPI to update (which also updates booking)
    if (shouldUpdate && newStatus !== previousStatus) {
      console.log(`🔄 Status changed: ${previousStatus} -> ${newStatus}`);

      // Use confirmPayment to properly update payment and booking
      const confirmResult = await PaymentAPI.confirmPayment({
        orderId: orderId,
        midtrans: {
          transaction_status: transactionStatus,
          payment_type: midtransStatus.payment_type,
          transaction_time: midtransStatus.transaction_time,
          transaction_id: midtransStatus.transaction_id,
          fraud_status: midtransStatus.fraud_status,
        },
      });

      if (!confirmResult.success) {
        console.error("❌ Failed to confirm payment:", confirmResult.error);
        return NextResponse.json({
          success: false,
          error: "Failed to update payment status",
        }, { status: 500 });
      }

      console.log("✅ Payment status updated successfully");

      return NextResponse.json({
        success: true,
        data: {
          previousStatus,
          currentStatus: newStatus,
          updated: true,
          message: `Status updated from ${previousStatus} to ${newStatus}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        previousStatus,
        currentStatus: newStatus,
        updated: false,
        message: "No status change needed",
        midtransStatus: transactionStatus,
      },
    });

  } catch (error: any) {
    console.error("❌ Error refreshing payment status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh payment status" },
      { status: 500 }
    );
  }
}
