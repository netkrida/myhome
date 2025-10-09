/**
 * GET /api/adminkos/rooms/[id]/detail
 * Get room detail with booking information (for AdminKos)
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosAPI } from "@/server/api/adminkos.api";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;

    // Get room detail
    const result = await AdminKosAPI.getRoomDetail(roomId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in GET /api/adminkos/rooms/[id]/detail:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

