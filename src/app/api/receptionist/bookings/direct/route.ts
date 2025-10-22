import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { BookingsApplication } from "@/server/api/bookings";
import { DirectBookingSchema } from "@/server/schemas/booking";
import type { DirectBookingRequestDTO } from "@/server/types/booking";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = DirectBookingSchema.safeParse(body);

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

    const idempotencyHeader = request.headers.get("idempotency-key") ?? undefined;

    const payload: DirectBookingRequestDTO = {
      ...parsed.data,
      checkInDate: new Date(parsed.data.checkInDate),
      checkOutDate: parsed.data.checkOutDate ? new Date(parsed.data.checkOutDate) : undefined,
      idempotencyKey: parsed.data.idempotencyKey ?? idempotencyHeader,
    };

    const result = await BookingsApplication.createDirectBooking(payload, user);

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
      { status: result.statusCode ?? 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/receptionist/bookings/direct:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
