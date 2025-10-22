import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { BookingsApplication } from "@/server/api/bookings";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'code' is required" },
        { status: 400 }
      );
    }

    const result = await BookingsApplication.getReceptionistBookingByCode(code.trim().toUpperCase(), user);

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
    console.error("Error in GET /api/receptionist/bookings/lookup:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
