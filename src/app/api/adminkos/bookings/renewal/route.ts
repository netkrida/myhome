import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserContext } from "@/server/lib/auth";
import { BookingsApplication } from "@/server/api/bookings";

export const runtime = "nodejs";

// Schema for renewal request
const RenewalRequestSchema = z.object({
  bookingId: z.string().cuid("Invalid booking ID"),
  leaseType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  depositOption: z.enum(["deposit", "full"]).default("full"),
  accountId: z.string().cuid("Invalid account ID"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RenewalRequestSchema.safeParse(body);

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

    const result = await BookingsApplication.renewBooking(
      parsed.data.bookingId,
      {
        leaseType: parsed.data.leaseType,
        depositOption: parsed.data.depositOption,
        accountId: parsed.data.accountId,
      },
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

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: result.statusCode ?? 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/adminkos/bookings/renewal:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
