/**
 * API Controller untuk Notifikasi WhatsApp
 * Endpoint untuk mengirim notifikasi WhatsApp otomatis berdasarkan event booking/payment/checkin/checkout
 */

import { NextRequest, NextResponse } from "next/server";
import * as NotificationApi from "@/server/api/notification.api";
import {
  bookingCreatedNotificationSchema,
  paymentSuccessNotificationSchema,
  checkInNotificationSchema,
  checkOutNotificationSchema,
  dueReminderNotificationSchema,
} from "@/server/schemas/notification.schema";

/**
 * POST /api/notifications/booking-created
 * Kirim notifikasi booking baru ke customer dan adminkos
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Controller: POST /api/notifications/booking-created");

    const body = await request.json();
    const validatedData = bookingCreatedNotificationSchema.parse(body);

    const result = await NotificationApi.sendBookingCreatedNotification(validatedData);

    if (!result.success) {
      console.error("❌ API Controller: Failed to send booking created notification", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "Failed to send booking created notification",
        },
        { status: 500 }
      );
    }

    console.log("✅ API Controller: Booking created notification sent successfully");
    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Booking created notification sent successfully",
    });
  } catch (error) {
    console.error("❌ API Controller: Error in POST /api/notifications/booking-created", error);

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
