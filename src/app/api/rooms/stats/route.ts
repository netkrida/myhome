import { NextRequest, NextResponse } from "next/server";
import { RoomsAPI } from "@/server/api/rooms.api";
import { getCurrentUserContext } from "@/server/lib/auth";

/**
 * GET /api/rooms/stats
 * Get room statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get user context
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || undefined;

    // Get room statistics
    const result = await RoomsAPI.getRoomStats(propertyId);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get room statistics";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/rooms/stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
