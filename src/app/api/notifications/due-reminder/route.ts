/**
 * API Controller untuk Pengingat Jatuh Tempo
 * Endpoint untuk mengirim pengingat jatuh tempo ke customer
 */

import { NextRequest, NextResponse } from "next/server";
import * as NotificationApi from "@/server/api/notification.api";
import { dueReminderNotificationSchema } from "@/server/schemas/notification.schema";

/**
 * POST /api/notifications/due-reminder
 * Kirim pengingat jatuh tempo ke customer
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Controller: POST /api/notifications/due-reminder");

    const body = await request.json();
    const validatedData = dueReminderNotificationSchema.parse(body);

    const result = await NotificationApi.sendDueReminderNotification(validatedData);

    if (!result.success) {
      console.error("❌ API Controller: Failed to send due reminder notification", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "Failed to send due reminder notification",
        },
        { status: 500 }
      );
    }

    console.log("✅ API Controller: Due reminder notification sent successfully");
    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Due reminder notification sent successfully",
    });
  } catch (error) {
    console.error("❌ API Controller: Error in POST /api/notifications/due-reminder", error);

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
