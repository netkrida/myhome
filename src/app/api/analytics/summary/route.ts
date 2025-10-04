import { NextRequest, NextResponse } from "next/server";
import { AnalyticsAPI } from "@/server/api/analytics.api";
import type { AnalyticsQueryDTO } from "@/server/types/analytics";

/**
 * GET /api/analytics/summary
 * Get comprehensive analytics summary
 * Only accessible by SUPERADMIN
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const query: AnalyticsQueryDTO = {};
    
    // Parse date filters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)" },
          { status: 400 }
        );
      }
      query.startDate = startDate;
    }
    
    if (endDateParam) {
      const endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)" },
          { status: 400 }
        );
      }
      query.endDate = endDate;
    }
    
    // Parse other filters
    const page = searchParams.get('page');
    const country = searchParams.get('country');
    const device = searchParams.get('device');
    const browser = searchParams.get('browser');
    
    if (page) query.page = page;
    if (country) query.country = country;
    if (device) query.device = device;
    if (browser) query.browser = browser;

    // Get analytics summary
    const result = await AnalyticsAPI.getAnalyticsSummary(Object.keys(query).length > 0 ? query : undefined);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get analytics summary";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/analytics/summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
