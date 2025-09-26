import { NextRequest, NextResponse } from "next/server";
import { UsersAPI } from "@/server/api/users.api";
import { getCurrentUserContext } from "@/server/lib/auth";

/**
 * GET /api/users/stats
 * Get user statistics
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

    // Get user statistics
    const result = await UsersAPI.getUserStats();

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get user stats";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/users/stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
