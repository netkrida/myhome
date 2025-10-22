import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { BookingsApplication } from "@/server/api/bookings";
import { BookingStatus } from "@/server/types/booking";

export const runtime = "nodejs";

const bookingStatuses = new Set<string>(Object.values(BookingStatus));

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const statusParam = searchParams.get("status");
    let status: BookingStatus | undefined;
    if (statusParam) {
      if (!bookingStatuses.has(statusParam)) {
        return NextResponse.json(
          { success: false, error: "Invalid status parameter" },
          { status: 400 }
        );
      }
      status = statusParam as BookingStatus;
    }

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search") ?? undefined;

    const page = pageParam ? Math.max(parseInt(pageParam, 10) || 1, 1) : undefined;
    const limit = limitParam ? Math.max(parseInt(limitParam, 10) || 1, 1) : undefined;

    const result = await BookingsApplication.listForReceptionist(
      { status, page, limit, search },
      user
    );

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

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in GET /api/receptionist/bookings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
