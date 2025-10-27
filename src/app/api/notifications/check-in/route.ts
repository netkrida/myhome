/**
 * API Controller untuk Notifikasi Check-in
 * Endpoint untuk mengirim notifikasi check-in ke customer dan adminkos
 */

import { NextRequest, NextResponse } from "next/server";
import * as NotificationApi from "@/server/api/notification.api";
import { checkInNotificationSchema } from "@/server/schemas/notification.schema";

/**
 * POST /api/notifications/check-in
 * Kirim notifikasi check-in ke customer dan adminkos
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Controller: POST /api/notifications/check-in");

    const body = await request.json();
    const validatedData = checkInNotificationSchema.parse(body);

    const result = await NotificationApi.sendCheckInNotification(validatedData);

    if (!result.success) {
      console.error("❌ API Controller: Failed to send check-in notification", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "Failed to send check-in notification",
        },
        { status: 500 }
      );
    }

    console.log("✅ API Controller: Check-in notification sent successfully");
    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Check-in notification sent successfully",
    });
  } catch (error) {
    console.error("❌ API Controller: Error in POST /api/notifications/check-in", error);

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
