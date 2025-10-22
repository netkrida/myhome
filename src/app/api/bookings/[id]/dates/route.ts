import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { BookingsApplication } from "@/server/api/bookings";
import { CheckInRequestSchema, UpdateBookingDatesSchema } from "@/server/schemas/booking";

export const runtime = "nodejs";

const BookingIdSchema = CheckInRequestSchema.shape.bookingId;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const idParse = BookingIdSchema.safeParse(params.id);
    if (!idParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid booking ID",
          details: idParse.error.flatten(),
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = UpdateBookingDatesSchema.safeParse(body);

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

    const payload = {
      checkInDate: new Date(parsed.data.checkInDate),
      checkOutDate: parsed.data.checkOutDate ? new Date(parsed.data.checkOutDate) : undefined,
    };

    const result = await BookingsApplication.updatePlannedDates(idParse.data, payload, user);

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
    console.error("Error in PATCH /api/bookings/[id]/dates:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
