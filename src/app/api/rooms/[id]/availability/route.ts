import { NextRequest, NextResponse } from "next/server";
import { RoomsAPI } from "@/server/api/rooms.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  updateRoomAvailabilitySchema,
  roomIdSchema,
  type UpdateRoomAvailabilityInput,
  type RoomIdInput
} from "@/server/schemas/room.schemas";

/**
 * PUT /api/rooms/[id]/availability
 * Update room availability
 */
export async function PUT(
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

    // Validate room ID
    const idValidationResult = roomIdSchema.safeParse({ id: resolvedParams.id });
    if (!idValidationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid room ID",
          details: idValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: RoomIdInput = idValidationResult.data;

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = updateRoomAvailabilitySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const availabilityData: UpdateRoomAvailabilityInput = validationResult.data;

    // Update room availability
    const result = await RoomsAPI.updateRoomAvailability(id, availabilityData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to update room availability";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PUT /api/rooms/[id]/availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
