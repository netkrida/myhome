/**
 * API Controller untuk Notifikasi Pembayaran Berhasil
 * Endpoint untuk mengirim notifikasi pembayaran berhasil ke customer dan adminkos
 */

import { NextRequest, NextResponse } from "next/server";
import * as NotificationApi from "@/server/api/notification.api";
import { paymentSuccessNotificationSchema } from "@/server/schemas/notification.schema";

/**
 * POST /api/notifications/payment-success
 * Kirim notifikasi pembayaran berhasil ke customer dan adminkos
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Controller: POST /api/notifications/payment-success");

    const body = await request.json();
    const validatedData = paymentSuccessNotificationSchema.parse(body);

    const result = await NotificationApi.sendPaymentSuccessNotification(validatedData);

    if (!result.success) {
      console.error("❌ API Controller: Failed to send payment success notification", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "Failed to send payment success notification",
        },
        { status: 500 }
      );
    }

    console.log("✅ API Controller: Payment success notification sent successfully");
    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Payment success notification sent successfully",
    });
  } catch (error) {
    console.error("❌ API Controller: Error in POST /api/notifications/payment-success", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
