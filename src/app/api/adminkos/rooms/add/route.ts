/**
 * POST /api/adminkos/rooms/add
 * Add new room
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosAPI } from "@/server/api/adminkos.api";
import { addRoomSchema } from "@/server/schemas/adminkos.schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = addRoomSchema.safeParse(body);
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

    // Add room
    const result = await AdminKosAPI.addRoom(validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Room added successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/adminkos/rooms/add:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
