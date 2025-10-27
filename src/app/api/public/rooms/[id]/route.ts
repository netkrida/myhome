import { NextRequest, NextResponse } from "next/server";
import { RoomRepository } from "@/server/repositories/adminkos/room.repository";
import { publicRoomDetailIdSchema, type PublicRoomDetailIdInput } from "@/server/schemas/room.schemas";

/**
 * GET /api/public/rooms/[id]
 * Get public room detail by ID
 * Tier 1: HTTP API controller
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;

    console.log("[public/rooms] GET request", { id: rawId });

    // Validate room ID parameter
    const validationResult = publicRoomDetailIdSchema.safeParse({ id: rawId });
    if (!validationResult.success) {
      console.log("[public/rooms] Invalid ID", validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid room ID format",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: PublicRoomDetailIdInput = validationResult.data;

    console.log("[public/rooms] Validated ID", id);

    // Get room detail from repository
    const room = await RoomRepository.getPublicRoomDetail(id);

    if (!room) {
      console.log("[public/rooms] Room not found or property not approved", { id });
      return NextResponse.json(
        {
          success: false,
          error: "Room not found or not available for public viewing"
        },
        { status: 404 }
      );
    }

    console.log("[public/rooms] Success", {
      roomId: room.id,
      roomNumber: room.roomNumber,
      propertyId: room.property.id,
      propertyName: room.property.name,
      imagesCount: room.images.length
    });

    return NextResponse.json({
      success: true,
      data: room,
    });

  } catch (error) {
    console.error("[public/rooms] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
