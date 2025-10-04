/**
 * Analytics-related DTOs and types
 */

// Website Visitor DTO
export interface WebsiteVisitorDTO {
  id: string;
  sessionId: string;
  ipAddress: string;
  userAgent?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  landingPage: string;
  isReturning: boolean;
  visitDuration?: number;
  pageViewCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
}

// Page View DTO
export interface PageViewDTO {
  id: string;
  visitorId: string;
  sessionId: string;
  page: string;
  title?: string;
  timeSpent?: number;
  createdAt: Date;
}

// Create Visitor DTO
export interface CreateVisitorDTO {
  sessionId: string;
  ipAddress: string;
  userAgent?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  landingPage: string;
  isReturning?: boolean;
}

// Create Page View DTO
export interface CreatePageViewDTO {
  visitorId: string;
  sessionId: string;
  page: string;
  title?: string;
  timeSpent?: number;
}

// Update Visitor DTO
export interface UpdateVisitorDTO {
  visitDuration?: number;
  pageViewCount?: number;
  lastSeenAt?: Date;
}

// Analytics Summary DTO
export interface AnalyticsSummaryDTO {
  totalVisitors: number;
  totalPageViews: number;
  uniqueVisitors: number;
  returningVisitors: number;
  averageSessionDuration: number;
  averagePageViews: number;
  topPages: Array<{
    page: string;
    views: number;
    percentage: number;
  }>;
  topCountries: Array<{
    country: string;
    visitors: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    visitors: number;
    percentage: number;
  }>;
  browserBreakdown: Array<{
    browser: string;
    visitors: number;
    percentage: number;
  }>;
}

// Analytics Query DTO
export interface AnalyticsQueryDTO {
  startDate?: Date;
  endDate?: Date;
  page?: string;
  country?: string;
  device?: string;
  browser?: string;
}

// Daily Analytics DTO
export interface DailyAnalyticsDTO {
  date: string;
  visitors: number;
  pageViews: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
}

// Real-time Analytics DTO
export interface RealTimeAnalyticsDTO {
  activeVisitors: number;
  currentPageViews: Array<{
    page: string;
    activeUsers: number;
  }>;
  recentVisitors: Array<{
    country?: string;
    city?: string;
    page: string;
    timestamp: Date;
  }>;
}

// Visitor Tracking Input
export interface VisitorTrackingInput {
  sessionId: string;
  page: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  timeSpent?: number;
}
