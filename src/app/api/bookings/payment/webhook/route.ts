import { NextRequest, NextResponse } from "next/server";
import { BookingAPI } from "@/server/api/booking.api";
import {
  midtransNotificationSchema,
  type MidtransNotificationInput
} from "@/server/schemas/booking.schemas";

/**
 * POST /api/bookings/payment/webhook
 * Handle Midtrans payment notification webhook
 * 
 * This endpoint is called by Midtrans server when payment status changes.
 * It's a PUBLIC endpoint (no authentication required) but secured with signature verification.
 * 
 * Flow:
 * 1. Midtrans sends POST request with payment notification
 * 2. Verify signature using server key
 * 3. Update payment status in database
 * 4. Update booking status based on payment status:
 *    - SUCCESS: UNPAID → DEPOSIT_PAID or CONFIRMED
 *    - FAILED/EXPIRED: UNPAID → EXPIRED
 * 5. Return 200 OK to Midtrans
 * 
 * Important:
 * - This endpoint must be publicly accessible (no auth middleware)
 * - Security is handled by signature verification in BookingAPI.handleMidtransNotification
 * - Must return 200 OK to prevent Midtrans from retrying
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate notification data
    const validationResult = midtransNotificationSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Invalid Midtrans notification:", validationResult.error.errors);
      return NextResponse.json(
        { 
          error: "Invalid notification data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const notification: MidtransNotificationInput = validationResult.data;

    // Log notification for debugging
    console.log("Midtrans notification received:", {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payment_type: notification.payment_type,
      gross_amount: notification.gross_amount
    });

    // Handle notification
    const result = await BookingAPI.handleMidtransNotification(notification);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to handle notification";
      
      console.error("Error handling Midtrans notification:", errorMessage);
      
      // Return 200 OK even on error to prevent Midtrans from retrying
      // Log the error for manual investigation
      return NextResponse.json(
        { 
          status: "error",
          message: errorMessage 
        },
        { status: 200 }
      );
    }

    // Success response
    return NextResponse.json(
      { 
        status: "success",
        message: "Notification processed successfully" 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in POST /api/bookings/payment/webhook:", error);
    
    // Return 200 OK even on error to prevent Midtrans from retrying
    return NextResponse.json(
      { 
        status: "error",
        message: "Internal server error" 
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/bookings/payment/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Midtrans webhook endpoint is active",
    timestamp: new Date().toISOString()
  });
}

