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
    const validationResult = roomIdSchema.safeParse({ id: resolvedParams.id });
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
    const result = await RoomsAPI.updateRoom(id, updateData as any);

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

/**
 * DELETE /api/rooms/[id]
 * Delete room (hard delete)
 */
export async function DELETE(
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
    const validationResult = roomIdSchema.safeParse({ id: resolvedParams.id });
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

    console.log("🗑️ DELETE API - Processing delete for room:", id);
    console.log("🗑️ DELETE API - User context:", {
      userId: userContext.id,
      role: userContext.role,
      email: userContext.email
    });

    // Check if user can manage this room by trying to get it first
    const room = await RoomsAPI.getRoomById(id);
    
    if (!room.success) {
      console.log("🗑️ DELETE API - Room not found or access denied:", room);
      const errorResult = room as any;
      return NextResponse.json(
        { error: errorResult.error?.message || "Room not found or access denied" },
        { status: errorResult.statusCode || 404 }
      );
    }

    console.log("🗑️ DELETE API - Room found, proceeding with hard delete");

    // Hard delete - completely remove the room from database
    const { RoomRepository } = await import("@/server/repositories/adminkos/room.repository");
    
    try {
      // Perform hard delete - remove room and all related data
      await RoomRepository.delete(id);

      console.log("🗑️ DELETE API - Room permanently deleted from database");
    } catch (repoError) {
      console.error("🗑️ DELETE API - Repository error:", repoError);
      throw new Error("Failed to delete room from database");
    }

    console.log("🗑️ DELETE API - Hard delete operation completed successfully");

    return NextResponse.json({ 
      success: true,
      message: "Room deleted successfully" 
    });
  } catch (error) {
    console.error("Error in DELETE /api/rooms/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
