import { NextRequest, NextResponse } from "next/server";
import { BookingAPI } from "@/server/api/booking.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { extendBookingSchema } from "@/server/schemas/booking.schemas";

/**
 * POST /api/bookings/[id]/extend
 * Extend booking for next period (e.g., next month)
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
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await params
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = extendBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation error",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Create extension booking
    const result = await BookingAPI.extendBooking(bookingId, validationResult.data);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to extend booking";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Perpanjangan sewa berhasil dibuat"
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/bookings/[id]/extend:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/[id]/extend
 * Get extension info for booking
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
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await params
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    // Get extension info
    const result = await BookingAPI.getExtensionInfo(bookingId);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get extension info";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error("Error in GET /api/bookings/[id]/extend:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
