import { NextRequest, NextResponse } from "next/server";
import { AnalyticsAPI } from "@/server/api/analytics.api";

/**
 * GET /api/analytics/visitors/stats
 * Get visitor statistics for specific time periods
 * Only accessible by SUPERADMIN
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'today' | 'week' | 'month' | 'year') || 'today';

    // Validate period parameter
    const validPeriods = ['today', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { 
          error: "Invalid period parameter. Must be one of: today, week, month, year",
          validPeriods 
        },
        { status: 400 }
      );
    }

    // Get visitor statistics
    const result = await AnalyticsAPI.getVisitorStats(period);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get visitor statistics";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/analytics/visitors/stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
