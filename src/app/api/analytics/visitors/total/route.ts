import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/analytics.service";
import { getCurrentUserContext } from "@/server/lib/auth";
import { AnalyticsRepository } from "@/server/repositories/superadmin/analytics.repository";

/**
 * GET /api/analytics/visitors/total
 * Get total visitors count
 * Accessible publicly but with role-based data filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'today' | 'week' | 'month' | 'year' | 'all') || 'all';

    // Validate period parameter
    const validPeriods = ['today', 'week', 'month', 'year', 'all'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        {
          error: "Invalid period parameter. Must be one of: today, week, month, year, all",
          validPeriods
        },
        { status: 400 }
      );
    }

    // Check if user is authenticated and has SUPERADMIN role
    const userContext = await getCurrentUserContext();

    if (!userContext || userContext.role !== 'SUPERADMIN') {
      return NextResponse.json(
        {
          error: "Forbidden - SUPERADMIN access required",
          message: "This endpoint requires SUPERADMIN authentication"
        },
        { status: 403 }
      );
    }

    // Get total visitors using service directly
    const totalVisitors = await AnalyticsService.getTotalVisitors(period);

    // Get visitor analytics summary
    const visitorsSummary = await AnalyticsRepository.getVisitorsSummary();

    // Calculate date range for response
    let dateRange;
    const now = new Date();

    switch (period) {
      case 'today':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateRange = {
          start: weekStart.toISOString(),
          end: now.toISOString()
        };
        break;
      case 'month':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          end: now.toISOString()
        };
        break;
      case 'year':
        dateRange = {
          start: new Date(now.getFullYear(), 0, 1).toISOString(),
          end: now.toISOString()
        };
        break;
      default:
        dateRange = undefined;
    }

    const response = {
      totalVisitors,
      period,
      ...(dateRange && { dateRange }),
      countries: visitorsSummary.countries,
      cities: visitorsSummary.cities,
      devices: visitorsSummary.devices,
      browsers: visitorsSummary.browsers,
      operatingSystems: visitorsSummary.operatingSystems,
      summary: {
        totalVisitors: visitorsSummary.totalVisitors,
        returningVisitors: visitorsSummary.returningVisitors,
        newVisitors: visitorsSummary.newVisitors,
        totalPageViews: visitorsSummary.totalPageViews,
        uniqueCountries: Object.keys(visitorsSummary.countries).length,
        uniqueCities: Object.keys(visitorsSummary.cities).length,
        uniqueDevices: Object.keys(visitorsSummary.devices).length,
        uniqueBrowsers: Object.keys(visitorsSummary.browsers).length,
        uniqueOperatingSystems: Object.keys(visitorsSummary.operatingSystems).length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/analytics/visitors/total:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
