/**
 * PATCH /api/adminkos/rooms/[id]/edit
 * Edit room details
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosAPI } from "@/server/api/adminkos.api";
import { editRoomSchema } from "@/server/schemas/adminkos.schemas";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const body = await request.json();

    // Validate request body
    const validationResult = editRoomSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Edit room
    const result = await AdminKosAPI.editRoom(roomId, validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Room updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/adminkos/rooms/[id]/edit:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
