import { NextRequest, NextResponse } from "next/server";
import { BookingAPI } from "@/server/api/booking.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import {
  bookingIdSchema,
  updateBookingStatusSchema,
  type BookingIdInput,
  type UpdateBookingStatusInput
} from "@/server/schemas/booking.schemas";

/**
 * GET /api/bookings/[id]
 * Get booking by ID
 */
export async function GET(
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

    // Get booking
    const result = await BookingAPI.getBooking(id);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get booking";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/bookings/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]/status
 * Update booking status
 */
export async function PATCH(
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateBookingStatusSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid status data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const statusData: UpdateBookingStatusInput = validationResult.data;

    // Update booking status
    const result = await BookingAPI.updateBookingStatus(id, statusData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to update booking status";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PATCH /api/bookings/[id]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
