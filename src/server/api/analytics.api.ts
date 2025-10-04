import { withAuth } from "../lib/auth";
import { AnalyticsService } from "../services/analytics.service";
import { forbidden, ok } from "../types/result";
import type { Result } from "../types/result";
import type { 
  AnalyticsSummaryDTO, 
  AnalyticsQueryDTO,
  DailyAnalyticsDTO,
  RealTimeAnalyticsDTO,
  VisitorTrackingInput
} from "../types/analytics";
import { UserRole } from "../types/rbac";

/**
 * Tier-2: Analytics Application Services
 * Orchestrates analytics use cases with proper authorization
 */
export class AnalyticsAPI {
  /**
   * Get comprehensive analytics summary
   * Only accessible by SUPERADMIN
   */
  static getAnalyticsSummary = withAuth(
    async (userContext, query?: AnalyticsQueryDTO): Promise<Result<AnalyticsSummaryDTO>> => {
      // Only SUPERADMIN can access analytics
      if (userContext.role !== UserRole.SUPERADMIN) {
        return forbidden("Only superadmin can access website analytics");
      }

      try {
  const summary = await AnalyticsService.getAnalyticsSummary(query);
  return ok(summary);
      } catch (error) {
        console.error("Error getting analytics summary:", error);
        return {
          success: false,
          error: {
            code: "ANALYTICS_ERROR",
            message: "Failed to retrieve analytics summary",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get visitor statistics for specific time periods
   * Only accessible by SUPERADMIN
   */
  static getVisitorStats = withAuth(
    async (
      userContext,
      period: 'today' | 'week' | 'month' | 'year' = 'today'
    ): Promise<Result<{
      totalVisitors: number;
      uniqueVisitors: number;
      pageViews: number;
      averageSessionDuration: number;
    }>> => {
      // Only SUPERADMIN can access analytics
      if (userContext.role !== UserRole.SUPERADMIN) {
        return forbidden("Only superadmin can access website analytics");
      }

      try {
  const stats = await AnalyticsService.getVisitorStats(period);
  return ok(stats);
      } catch (error) {
        console.error("Error getting visitor stats:", error);
        return {
          success: false,
          error: {
            code: "ANALYTICS_ERROR",
            message: "Failed to retrieve visitor statistics",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get daily analytics for a date range
   * Only accessible by SUPERADMIN
   */
  static getDailyAnalytics = withAuth(
    async (
      userContext,
      startDate: Date,
      endDate: Date
    ): Promise<Result<DailyAnalyticsDTO[]>> => {
      // Only SUPERADMIN can access analytics
      if (userContext.role !== UserRole.SUPERADMIN) {
        return forbidden("Only superadmin can access website analytics");
      }

      try {
  const analytics = await AnalyticsService.getDailyAnalytics(startDate, endDate);
  return ok(analytics);
      } catch (error) {
        console.error("Error getting daily analytics:", error);
        return {
          success: false,
          error: {
            code: "ANALYTICS_ERROR",
            message: "Failed to retrieve daily analytics",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get real-time analytics
   * Only accessible by SUPERADMIN
   */
  static getRealTimeAnalytics = withAuth(
    async (userContext): Promise<Result<RealTimeAnalyticsDTO>> => {
      // Only SUPERADMIN can access analytics
      if (userContext.role !== UserRole.SUPERADMIN) {
        return forbidden("Only superadmin can access website analytics");
      }

      try {
  const realTimeData = await AnalyticsService.getRealTimeAnalytics();
  return ok(realTimeData);
      } catch (error) {
        console.error("Error getting real-time analytics:", error);
        return {
          success: false,
          error: {
            code: "ANALYTICS_ERROR",
            message: "Failed to retrieve real-time analytics",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Track visitor (public endpoint for frontend tracking)
   * No authentication required as this is for tracking public visitors
   */
  static trackVisitor = async (
    input: VisitorTrackingInput,
    ipAddress: string,
    userAgent?: string
  ): Promise<Result<{ success: boolean }>> => {
    try {
      await AnalyticsService.trackVisitor(input, ipAddress, userAgent);
      return ok({ success: true });
    } catch (error) {
      console.error("Error tracking visitor:", error);
      // Don't return error to avoid breaking the main application
      return ok({ success: false });
    }
  };

  /**
   * Get total visitors count (simplified endpoint for quick access)
   * Only accessible by SUPERADMIN
   */
  static getTotalVisitors = withAuth(
    async (
      userContext,
      period: 'today' | 'week' | 'month' | 'year' | 'all' = 'all'
    ): Promise<Result<{
      totalVisitors: number;
      period: string;
      dateRange?: {
        startDate: string;
        endDate: string;
      };
    }>> => {
      // Only SUPERADMIN can access analytics
      if (userContext.role !== UserRole.SUPERADMIN) {
        return forbidden("Only superadmin can access website analytics");
      }

      try {
        let query: AnalyticsQueryDTO | undefined;
        const now = new Date();
        let startDate: Date | undefined;

        if (period !== 'all') {
          switch (period) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              break;
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'year':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
          }

          if (startDate) {
            query = {
              startDate,
              endDate: now,
            };
          }
        }

        const stats = await AnalyticsService.getVisitorStats(period === 'all' ? 'year' : period);
        
        const result = {
          totalVisitors: stats.totalVisitors,
          period,
          ...(startDate && {
            dateRange: {
              startDate: startDate.toISOString(),
              endDate: now.toISOString(),
            },
          }),
        };

  return ok(result);
      } catch (error) {
        console.error("Error getting total visitors:", error);
        return {
          success: false,
          error: {
            code: "ANALYTICS_ERROR",
            message: "Failed to retrieve total visitors count",
          },
          statusCode: 500,
        };
      }
    }
  );
}
