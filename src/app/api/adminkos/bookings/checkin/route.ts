import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { BookingsApplication } from "@/server/api/bookings";
import { CheckInRequestSchema } from "@/server/schemas/booking";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CheckInRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await BookingsApplication.adminKosCheckIn(parsed.data.bookingId, user);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: result.statusCode ?? 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/adminkos/bookings/checkin:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
