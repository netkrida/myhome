import { NextRequest, NextResponse } from "next/server";
import { RoomsAPI } from "@/server/api/rooms.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  updateRoomSchema,
  roomIdSchema,
  type UpdateRoomInput,
  type RoomIdInput
} from "@/server/schemas/room.schemas";

/**
 * GET /api/rooms/[id]
 * Get room by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate room ID
    const validationResult = roomIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid room ID",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: RoomIdInput = validationResult.data;

    // Get room
    const result = await RoomsAPI.getRoomById(id);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get room";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/rooms/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rooms/[id]
 * Update room
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate room ID
    const idValidationResult = roomIdSchema.safeParse({ id: params.id });
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
    const validationResult = updateRoomSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updateData: UpdateRoomInput = validationResult.data;

    // Update room
    const result = await RoomsAPI.updateRoom(id, updateData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to update room";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PUT /api/rooms/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
