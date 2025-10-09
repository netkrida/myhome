/**
 * GET /api/adminkos/rooms/summary
 * Get rooms summary for new rooms page
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosAPI } from "@/server/api/adminkos.api";
import { roomsSummaryQuerySchema } from "@/server/schemas/adminkos.schemas";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validationResult = roomsSummaryQuerySchema.safeParse(queryParams);
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

    // Get rooms summary
    const result = await AdminKosAPI.getRoomsSummary(validationResult.data.propertyId);

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
    console.error("Error in GET /api/adminkos/rooms/summary:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
