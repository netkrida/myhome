/**
 * Analytics Utilities
 * Client-side utilities for tracking website visitors
 */

export interface DeviceInfo {
  device?: string;
  browser?: string;
  os?: string;
}

export interface PageInfo {
  page: string;
  title?: string;
  referrer?: string;
}

export interface TrackingData {
  sessionId: string;
  page: string;
  title?: string;
  referrer?: string;
  timeSpent?: number;
}

/**
 * Generate a unique session ID for the current browser session
 */
export function generateSessionId(): string {
  // Check if session ID already exists in sessionStorage
  const existingSessionId = sessionStorage.getItem('analytics_session_id');
  if (existingSessionId) {
    return existingSessionId;
  }

  // Generate new session ID
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  const sessionId = `${timestamp}_${randomStr}`;

  // Store in sessionStorage
  sessionStorage.setItem('analytics_session_id', sessionId);
  
  return sessionId;
}

/**
 * Detect device, browser, and OS information from user agent
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {};
  }

  const userAgent = navigator.userAgent;
  const deviceInfo: DeviceInfo = {};

  // Detect device type
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/iPad/i.test(userAgent)) {
      deviceInfo.device = 'tablet';
    } else {
      deviceInfo.device = 'mobile';
    }
  } else {
    deviceInfo.device = 'desktop';
  }

  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    deviceInfo.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    deviceInfo.browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    deviceInfo.browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    deviceInfo.browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    deviceInfo.browser = 'Opera';
  } else {
    deviceInfo.browser = 'Other';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    deviceInfo.os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    deviceInfo.os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    deviceInfo.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    deviceInfo.os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    deviceInfo.os = 'iOS';
  } else {
    deviceInfo.os = 'Other';
  }

  return deviceInfo;
}

/**
 * Get current page information
 */
export function getPageInfo(): PageInfo {
  if (typeof window === 'undefined') {
    return { page: '/' };
  }

  return {
    page: window.location.pathname,
    title: document.title || undefined,
    referrer: document.referrer || undefined,
  };
}

/**
 * Send tracking data to analytics API
 */
export async function sendTrackingData(data: TrackingData): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Return success even if response is not ok to avoid breaking the main app
    return response.ok;
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
    return false;
  }
}

/**
 * Track page view with automatic data collection
 */
export async function trackPageView(timeSpent?: number): Promise<boolean> {
  try {
    const sessionId = generateSessionId();
    const pageInfo = getPageInfo();
    
    const trackingData: TrackingData = {
      sessionId,
      ...pageInfo,
      timeSpent,
    };

    return await sendTrackingData(trackingData);
  } catch (error) {
    console.warn('Failed to track page view:', error);
    return false;
  }
}

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if analytics tracking is enabled
 * Can be extended to check user preferences, GDPR consent, etc.
 */
export function isTrackingEnabled(): boolean {
  // For now, always return true
  // In the future, this can check:
  // - User consent for analytics
  // - GDPR compliance
  // - User preferences
  // - Environment variables
  
  return true;
}

/**
 * Get or create visitor ID for cross-session tracking
 * Uses localStorage for persistence across browser sessions
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') {
    return 'server_visitor';
  }

  const existingVisitorId = localStorage.getItem('analytics_visitor_id');
  if (existingVisitorId) {
    return existingVisitorId;
  }

  // Generate new visitor ID
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  const visitorId = `visitor_${timestamp}_${randomStr}`;

  // Store in localStorage for persistence
  localStorage.setItem('analytics_visitor_id', visitorId);
  
  return visitorId;
}
