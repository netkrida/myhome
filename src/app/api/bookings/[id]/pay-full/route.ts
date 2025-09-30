import { NextRequest, NextResponse } from "next/server";
import { BookingAPI } from "@/server/api/booking.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import {
  bookingIdSchema,
  type BookingIdInput
} from "@/server/schemas/booking.schemas";

/**
 * POST /api/bookings/[id]/pay-full
 * Create full payment for booking with deposit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user context
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await params
    const resolvedParams = await params;

    // Validate booking ID
    const idValidationResult = bookingIdSchema.safeParse({ id: resolvedParams.id });
    if (!idValidationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid booking ID",
          details: idValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: BookingIdInput = idValidationResult.data;

    // Create full payment
    const result = await BookingAPI.createFullPayment(id);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to create full payment";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/bookings/[id]/pay-full:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
