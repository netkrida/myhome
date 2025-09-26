import { NextRequest, NextResponse } from "next/server";
import { PropertiesAPI } from "@/server/api/properties.api";
import { getCurrentUserContext } from "@/server/lib/auth";

/**
 * GET /api/properties/stats
 * Get property statistics
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

    // Get property statistics
    const result = await PropertiesAPI.getPropertyStats();

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get property statistics";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/properties/stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
