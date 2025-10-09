/**
 * GET /api/adminkos/rooms/grid
 * Get rooms for grid view
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosAPI } from "@/server/api/adminkos.api";
import { z } from "zod";

const roomsGridQuerySchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
});

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validationResult = roomsGridQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Get rooms grid
    const result = await AdminKosAPI.getRoomsGrid(validationResult.data.propertyId);

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
    console.error("Error in GET /api/adminkos/rooms/grid:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
