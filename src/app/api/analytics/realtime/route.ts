import { NextRequest, NextResponse } from "next/server";
import { AnalyticsAPI } from "@/server/api/analytics.api";

/**
 * GET /api/analytics/realtime
 * Get real-time analytics (last 30 minutes)
 * Only accessible by SUPERADMIN
 */
export async function GET(request: NextRequest) {
  try {
    // Get real-time analytics
    const result = await AnalyticsAPI.getRealTimeAnalytics();

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get real-time analytics";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/analytics/realtime:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
