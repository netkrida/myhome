import { prisma } from "../../db";
import type { PageView, WebsiteVisitor } from "@prisma/client";
import type {
  WebsiteVisitorDTO,
  PageViewDTO,
  CreateVisitorDTO,
  CreatePageViewDTO,
  UpdateVisitorDTO,
  AnalyticsQueryDTO,
  DailyAnalyticsDTO,
} from "../../types/analytics";

function mapWebsiteVisitor(visitor: WebsiteVisitor): WebsiteVisitorDTO {
  return {
    id: visitor.id,
    sessionId: visitor.sessionId,
    ipAddress: visitor.ipAddress,
    userAgent: visitor.userAgent ?? undefined,
    country: visitor.country ?? undefined,
    city: visitor.city ?? undefined,
    device: visitor.device ?? undefined,
    browser: visitor.browser ?? undefined,
    os: visitor.os ?? undefined,
    referrer: visitor.referrer ?? undefined,
    landingPage: visitor.landingPage,
    isReturning: visitor.isReturning,
    visitDuration: visitor.visitDuration ?? undefined,
    pageViewCount: visitor.pageViewCount,
    createdAt: visitor.createdAt,
    updatedAt: visitor.updatedAt,
    lastSeenAt: visitor.lastSeenAt,
  };
}

function mapPageView(pageView: PageView): PageViewDTO {
  return {
    id: pageView.id,
    visitorId: pageView.visitorId,
    sessionId: pageView.sessionId,
    page: pageView.page,
    title: pageView.title ?? undefined,
    timeSpent: pageView.timeSpent ?? undefined,
    createdAt: pageView.createdAt,
  };
}

/**
 * Tier-3: Analytics Repository
 * Data access layer for website analytics
 */
export class AnalyticsRepository {
  /**
   * Create a new website visitor
   */
  static async createVisitor(data: CreateVisitorDTO): Promise<WebsiteVisitorDTO> {
    const visitor = await prisma.websiteVisitor.create({
      data: {
        sessionId: data.sessionId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        country: data.country,
        city: data.city,
        device: data.device,
        browser: data.browser,
        os: data.os,
        referrer: data.referrer,
        landingPage: data.landingPage,
        isReturning: data.isReturning || false,
      },
    });

    return mapWebsiteVisitor(visitor);
  }

  /**
   * Find visitor by session ID
   */
  static async findVisitorBySessionId(sessionId: string): Promise<WebsiteVisitorDTO | null> {
    const visitor = await prisma.websiteVisitor.findUnique({
      where: { sessionId },
    });

    return visitor ? mapWebsiteVisitor(visitor) : null;
  }

  /**
   * Update visitor data
   */
  static async updateVisitor(
    sessionId: string,
    data: UpdateVisitorDTO
  ): Promise<WebsiteVisitorDTO> {
    const visitor = await prisma.websiteVisitor.update({
      where: { sessionId },
      data: {
        visitDuration: data.visitDuration,
        pageViewCount: data.pageViewCount,
        lastSeenAt: data.lastSeenAt || new Date(),
        updatedAt: new Date(),
      },
    });

    return mapWebsiteVisitor(visitor);
  }

  /**
   * Create a new page view
   */
  static async createPageView(data: CreatePageViewDTO): Promise<PageViewDTO> {
    const pageView = await prisma.pageView.create({
      data: {
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        page: data.page,
        title: data.title,
        timeSpent: data.timeSpent,
      },
    });

    return mapPageView(pageView);
  }

  /**
   * Get visitors summary analytics (countries, cities, devices, etc.)
   */
  static async getVisitorsSummary(): Promise<{
    totalVisitors: number;
    returningVisitors: number;
    newVisitors: number;
    totalPageViews: number;
    countries: { [key: string]: number };
    cities: { [key: string]: number };
    devices: { [key: string]: number };
    browsers: { [key: string]: number };
    operatingSystems: { [key: string]: number };
  }> {
    // Get basic counts
    const [totalVisitors, returningVisitors, totalPageViews] = await Promise.all([
      prisma.websiteVisitor.count(),
      prisma.websiteVisitor.count({ where: { isReturning: true } }),
      prisma.websiteVisitor.aggregate({
        _sum: { pageViewCount: true }
      })
    ]);

    // Get grouped counts for analytics
    const [countriesData, citiesData, devicesData, browsersData, operatingSystemsData] = await Promise.all([
      prisma.websiteVisitor.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { country: true }
      }),
      prisma.websiteVisitor.groupBy({
        by: ['city'],
        where: { city: { not: null } },
        _count: { city: true }
      }),
      prisma.websiteVisitor.groupBy({
        by: ['device'],
        where: { device: { not: null } },
        _count: { device: true }
      }),
      prisma.websiteVisitor.groupBy({
        by: ['browser'],
        where: { browser: { not: null } },
        _count: { browser: true }
      }),
      prisma.websiteVisitor.groupBy({
        by: ['os'],
        where: { os: { not: null } },
        _count: { os: true }
      })
    ]);

    // Convert grouped data to objects with counts
    const countries: { [key: string]: number } = {};
    countriesData.forEach(item => {
      if (item.country) {
        countries[item.country] = item._count.country;
      }
    });

    const cities: { [key: string]: number } = {};
    citiesData.forEach(item => {
      if (item.city) {
        cities[item.city] = item._count.city;
      }
    });

    const devices: { [key: string]: number } = {};
    devicesData.forEach(item => {
      if (item.device) {
        devices[item.device] = item._count.device;
      }
    });

    const browsers: { [key: string]: number } = {};
    browsersData.forEach(item => {
      if (item.browser) {
        browsers[item.browser] = item._count.browser;
      }
    });

    const operatingSystems: { [key: string]: number } = {};
    operatingSystemsData.forEach(item => {
      if (item.os) {
        operatingSystems[item.os] = item._count.os;
      }
    });

    return {
      totalVisitors,
      returningVisitors,
      newVisitors: totalVisitors - returningVisitors,
      totalPageViews: totalPageViews._sum.pageViewCount || 0,
      countries,
      cities,
      devices,
      browsers,
      operatingSystems
    };
  }

  /**
   * Get all website visitors with their complete data
   */
  static async getAllVisitors(): Promise<WebsiteVisitorDTO[]> {
    const visitors = await prisma.websiteVisitor.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        pageViews: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return visitors.map((visitor) => ({
      ...mapWebsiteVisitor(visitor),
      pageViews: visitor.pageViews.map(mapPageView),
    }));
  }

  /**
   * Get total visitors count
   */
  static async getTotalVisitors(query?: AnalyticsQueryDTO): Promise<number> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    if (query?.country) where.country = query.country;
    if (query?.device) where.device = query.device;
    if (query?.browser) where.browser = query.browser;

    return await prisma.websiteVisitor.count({ where });
  }

  /**
   * Get total page views count
   */
  static async getTotalPageViews(query?: AnalyticsQueryDTO): Promise<number> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    if (query?.page) where.page = query.page;

    return await prisma.pageView.count({ where });
  }

  /**
   * Get unique visitors count
   */
  static async getUniqueVisitors(query?: AnalyticsQueryDTO): Promise<number> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    if (query?.country) where.country = query.country;
    if (query?.device) where.device = query.device;
    if (query?.browser) where.browser = query.browser;

    const result = await prisma.websiteVisitor.groupBy({
      by: ['ipAddress'],
      where,
      _count: {
        ipAddress: true,
      },
    });

    return result.length;
  }

  /**
   * Get returning visitors count
   */
  static async getReturningVisitors(query?: AnalyticsQueryDTO): Promise<number> {
    const where: any = { isReturning: true };

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    if (query?.country) where.country = query.country;
    if (query?.device) where.device = query.device;
    if (query?.browser) where.browser = query.browser;

    return await prisma.websiteVisitor.count({ where });
  }

  /**
   * Get average session duration
   */
  static async getAverageSessionDuration(query?: AnalyticsQueryDTO): Promise<number> {
    const where: any = {
      visitDuration: { not: null },
    };

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    if (query?.country) where.country = query.country;
    if (query?.device) where.device = query.device;
    if (query?.browser) where.browser = query.browser;

    const result = await prisma.websiteVisitor.aggregate({
      where,
      _avg: {
        visitDuration: true,
      },
    });

    return result._avg.visitDuration || 0;
  }

  /**
   * Get top pages by views
   */
  static async getTopPages(
    limit: number = 10,
    query?: AnalyticsQueryDTO
  ): Promise<Array<{ page: string; views: number }>> {
    const where: any = {};

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const result = await prisma.pageView.groupBy({
      by: ['page'],
      where,
      _count: {
        page: true,
      },
      orderBy: {
        _count: {
          page: 'desc',
        },
      },
      take: limit,
    });

    return result.map((item) => ({
      page: item.page,
      views: item._count.page,
    }));
  }

  /**
   * Get top countries by visitors
   */
  static async getTopCountries(
    limit: number = 10,
    query?: AnalyticsQueryDTO
  ): Promise<Array<{ country: string; visitors: number }>> {
    const where: any = {
      country: { not: null },
    };

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const result = await prisma.websiteVisitor.groupBy({
      by: ['country'],
      where,
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: 'desc',
        },
      },
      take: limit,
    });

    return result.map((item) => ({
      country: item.country || 'Unknown',
      visitors: item._count.country,
    }));
  }

  /**
   * Get device breakdown
   */
  static async getDeviceBreakdown(
    query?: AnalyticsQueryDTO
  ): Promise<Array<{ device: string; visitors: number }>> {
    const where: any = {
      device: { not: null },
    };

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const result = await prisma.websiteVisitor.groupBy({
      by: ['device'],
      where,
      _count: {
        device: true,
      },
      orderBy: {
        _count: {
          device: 'desc',
        },
      },
    });

    return result.map((item) => ({
      device: item.device || 'Unknown',
      visitors: item._count.device,
    }));
  }

  /**
   * Get browser breakdown
   */
  static async getBrowserBreakdown(
    query?: AnalyticsQueryDTO
  ): Promise<Array<{ browser: string; visitors: number }>> {
    const where: any = {
      browser: { not: null },
    };

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const result = await prisma.websiteVisitor.groupBy({
      by: ['browser'],
      where,
      _count: {
        browser: true,
      },
      orderBy: {
        _count: {
          browser: 'desc',
        },
      },
    });

    return result.map((item) => ({
      browser: item.browser || 'Unknown',
      visitors: item._count.browser,
    }));
  }

  /**
   * Get daily analytics for a date range
   */
  static async getDailyAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<DailyAnalyticsDTO[]> {
    // This is a simplified version - in production you might want to use raw SQL for better performance
    const visitors = await prisma.websiteVisitor.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        visitDuration: true,
        pageViewCount: true,
        ipAddress: true,
      },
    });

    const pageViews = await prisma.pageView.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by date
    const dailyData: { [key: string]: DailyAnalyticsDTO } = {};

    visitors.forEach((visitor) => {
      const [datePart] = visitor.createdAt.toISOString().split('T');
      if (!datePart) {
        return;
      }
      if (!dailyData[datePart]) {
        dailyData[datePart] = {
          date: datePart,
          visitors: 0,
          pageViews: 0,
          uniqueVisitors: 0,
          averageSessionDuration: 0,
        };
      }
      dailyData[datePart].visitors += 1;
    });

    pageViews.forEach((pageView) => {
      const [datePart] = pageView.createdAt.toISOString().split('T');
      if (datePart && dailyData[datePart]) {
        dailyData[datePart].pageViews += 1;
      }
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Check if IP address is returning visitor
   */
  static async isReturningVisitor(ipAddress: string): Promise<boolean> {
    const existingVisitor = await prisma.websiteVisitor.findFirst({
      where: { ipAddress },
    });

    return !!existingVisitor;
  }
}
