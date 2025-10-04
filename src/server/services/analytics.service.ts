import { AnalyticsRepository } from "../repositories/analytics.repository";
import type {
  AnalyticsSummaryDTO,
  AnalyticsQueryDTO,
  VisitorTrackingInput,
  DailyAnalyticsDTO,
  RealTimeAnalyticsDTO,
} from "../types/analytics";

/**
 * Tier-3: Analytics Domain Service
 * Pure business logic for website analytics
 */
export class AnalyticsService {
  /**
   * Track a visitor and page view
   */
  static async trackVisitor(
    input: VisitorTrackingInput,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Check if visitor already exists
      let visitor = await AnalyticsRepository.findVisitorBySessionId(input.sessionId);

      if (!visitor) {
        // Parse user agent for device/browser info
        const deviceInfo = this.parseUserAgent(userAgent);
        
        // Check if this is a returning visitor based on IP
        const isReturning = await AnalyticsRepository.isReturningVisitor(ipAddress);

        // Create new visitor
        visitor = await AnalyticsRepository.createVisitor({
          sessionId: input.sessionId,
          ipAddress,
          userAgent,
          landingPage: input.page,
          referrer: input.referrer,
          isReturning,
          ...deviceInfo,
        });
      } else {
        // Update existing visitor
        await AnalyticsRepository.updateVisitor(input.sessionId, {
          pageViewCount: visitor.pageViewCount + 1,
          visitDuration: input.timeSpent,
          lastSeenAt: new Date(),
        });
      }

      // Create page view record
      await AnalyticsRepository.createPageView({
        visitorId: visitor.id,
        sessionId: input.sessionId,
        page: input.page,
        title: input.title,
        timeSpent: input.timeSpent,
      });
    } catch (error) {
      console.error("Error tracking visitor:", error);
      // Don't throw error to avoid breaking the main application
    }
  }

  /**
   * Get total visitors count for a specific period
   */
  static async getTotalVisitors(
    period: 'today' | 'week' | 'month' | 'year' | 'all' = 'all'
  ): Promise<number> {
    const query = this.buildQueryFromPeriod(period);
    return await AnalyticsRepository.getTotalVisitors(query);
  }

  /**
   * Build query object from period string
   */
  private static buildQueryFromPeriod(
    period: 'today' | 'week' | 'month' | 'year' | 'all'
  ): AnalyticsQueryDTO {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // 'all'
        return {}; // No date filter for 'all'
    }

    return {
      startDate,
      endDate: now,
    };
  }

  /**
   * Get comprehensive analytics summary
   */
  static async getAnalyticsSummary(query?: AnalyticsQueryDTO): Promise<AnalyticsSummaryDTO> {
    const [
      totalVisitors,
      totalPageViews,
      uniqueVisitors,
      returningVisitors,
      averageSessionDuration,
      topPages,
      topCountries,
      deviceBreakdown,
      browserBreakdown,
    ] = await Promise.all([
      AnalyticsRepository.getTotalVisitors(query),
      AnalyticsRepository.getTotalPageViews(query),
      AnalyticsRepository.getUniqueVisitors(query),
      AnalyticsRepository.getReturningVisitors(query),
      AnalyticsRepository.getAverageSessionDuration(query),
      AnalyticsRepository.getTopPages(10, query),
      AnalyticsRepository.getTopCountries(10, query),
      AnalyticsRepository.getDeviceBreakdown(query),
      AnalyticsRepository.getBrowserBreakdown(query),
    ]);

    // Calculate percentages
    const topPagesWithPercentage = topPages.map((page) => ({
      ...page,
      percentage: totalPageViews > 0 ? (page.views / totalPageViews) * 100 : 0,
    }));

    const topCountriesWithPercentage = topCountries.map((country) => ({
      ...country,
      percentage: totalVisitors > 0 ? (country.visitors / totalVisitors) * 100 : 0,
    }));

    const deviceBreakdownWithPercentage = deviceBreakdown.map((device) => ({
      ...device,
      percentage: totalVisitors > 0 ? (device.visitors / totalVisitors) * 100 : 0,
    }));

    const browserBreakdownWithPercentage = browserBreakdown.map((browser) => ({
      ...browser,
      percentage: totalVisitors > 0 ? (browser.visitors / totalVisitors) * 100 : 0,
    }));

    return {
      totalVisitors,
      totalPageViews,
      uniqueVisitors,
      returningVisitors,
      averageSessionDuration: Math.round(averageSessionDuration),
      averagePageViews: totalVisitors > 0 ? Math.round(totalPageViews / totalVisitors * 100) / 100 : 0,
      topPages: topPagesWithPercentage,
      topCountries: topCountriesWithPercentage,
      deviceBreakdown: deviceBreakdownWithPercentage,
      browserBreakdown: browserBreakdownWithPercentage,
    };
  }

  /**
   * Get daily analytics for a date range
   */
  static async getDailyAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<DailyAnalyticsDTO[]> {
    return await AnalyticsRepository.getDailyAnalytics(startDate, endDate);
  }

  /**
   * Get real-time analytics (last 30 minutes)
   */
  static async getRealTimeAnalytics(): Promise<RealTimeAnalyticsDTO> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const query: AnalyticsQueryDTO = {
      startDate: thirtyMinutesAgo,
      endDate: new Date(),
    };

    const [activeVisitors, recentPageViews] = await Promise.all([
      AnalyticsRepository.getTotalVisitors(query),
      AnalyticsRepository.getTopPages(10, query),
    ]);

    // For simplicity, we'll use mock data for current page views and recent visitors
    // In a real implementation, you'd want to track this more precisely
    return {
      activeVisitors,
      currentPageViews: recentPageViews.map((page) => ({
        page: page.page,
        activeUsers: Math.ceil(page.views / 2), // Rough estimate
      })),
      recentVisitors: [], // Would need more complex tracking for this
    };
  }

  /**
   * Parse user agent string to extract device/browser info
   */
  private static parseUserAgent(userAgent?: string): {
    device?: string;
    browser?: string;
    os?: string;
  } {
    if (!userAgent) return {};

    const ua = userAgent.toLowerCase();
    
    // Detect device
    let device = 'desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      device = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = 'tablet';
    }

    // Detect browser
    let browser = 'unknown';
    if (ua.includes('chrome') && !ua.includes('edg')) {
      browser = 'chrome';
    } else if (ua.includes('firefox')) {
      browser = 'firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'safari';
    } else if (ua.includes('edg')) {
      browser = 'edge';
    } else if (ua.includes('opera') || ua.includes('opr')) {
      browser = 'opera';
    }

    // Detect OS
    let os = 'unknown';
    if (ua.includes('windows')) {
      os = 'windows';
    } else if (ua.includes('mac')) {
      os = 'macos';
    } else if (ua.includes('linux')) {
      os = 'linux';
    } else if (ua.includes('android')) {
      os = 'android';
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      os = 'ios';
    }

    return { device, browser, os };
  }

  /**
   * Get visitor statistics for a specific time period
   */
  static async getVisitorStats(
    period: 'today' | 'week' | 'month' | 'year' = 'today'
  ): Promise<{
    totalVisitors: number;
    uniqueVisitors: number;
    pageViews: number;
    averageSessionDuration: number;
  }> {
    const now = new Date();
    let startDate: Date;

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
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const query: AnalyticsQueryDTO = {
      startDate,
      endDate: now,
    };

    const [totalVisitors, uniqueVisitors, pageViews, averageSessionDuration] = await Promise.all([
      AnalyticsRepository.getTotalVisitors(query),
      AnalyticsRepository.getUniqueVisitors(query),
      AnalyticsRepository.getTotalPageViews(query),
      AnalyticsRepository.getAverageSessionDuration(query),
    ]);

    return {
      totalVisitors,
      uniqueVisitors,
      pageViews,
      averageSessionDuration: Math.round(averageSessionDuration),
    };
  }

  /**
   * Get IP address from request headers
   */
  static getClientIP(headers: Headers): string {
    // Check various headers for the real IP address
    const xForwardedFor = headers.get('x-forwarded-for');
    const xRealIP = headers.get('x-real-ip');
    const cfConnectingIP = headers.get('cf-connecting-ip');
    
    if (xForwardedFor) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const [forwardedIp] = xForwardedFor.split(',');
      if (forwardedIp) {
        return forwardedIp.trim();
      }
    }
    
    if (xRealIP) {
      return xRealIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // Fallback to localhost for development
    return '127.0.0.1';
  }
}
