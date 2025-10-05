"use client";

import { useEffect, useState } from 'react';
import { usePageTracking } from '@/hooks/use-page-tracking';
import type { UsePageTrackingOptions } from '@/hooks/use-page-tracking';
import { isTrackingEnabled, getDeviceInfo, getVisitorId } from '@/lib/analytics-utils';

export interface AnalyticsTrackerProps {
  /**
   * Page tracking options
   */
  trackingOptions?: UsePageTrackingOptions;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
  
  /**
   * Enable tracking (can be used for conditional tracking)
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Custom tracking identifier (optional)
   */
  trackingId?: string;
}

/**
 * Analytics Tracker Component
 * Automatically tracks page views and user interactions
 * Should be placed in the root layout or main app component
 */
export function AnalyticsTracker({
  trackingOptions = {
    trackRouteChanges: true,
    trackTimeSpent: false,
    debounceDelay: 1000,
    trackVisibilityChanges: false,
  },
  debug = false,
  enabled = true,
  trackingId,
}: AnalyticsTrackerProps) {
  const [isClient, setIsClient] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof getDeviceInfo>>({});
  const [visitorId, setVisitorId] = useState<string>('');

  // Initialize page tracking hook
  const tracking = usePageTracking(trackingOptions);

  // Ensure this only runs on client side
  useEffect(() => {
    setIsClient(true);
    
    // Get device info and visitor ID
    const info = getDeviceInfo();
    const vId = getVisitorId();
    
    setDeviceInfo(info);
    setVisitorId(vId);

    if (debug) {
      console.log('🔍 Analytics Tracker Initialized:', {
        enabled: enabled && isTrackingEnabled(),
        deviceInfo: info,
        visitorId: vId,
        trackingId,
        trackingOptions,
      });
    }
  }, [debug, enabled, trackingId, trackingOptions]);

  // Log tracking events in debug mode
  useEffect(() => {
    if (!debug || !isClient) return;

    const originalTrackPage = tracking.trackPage;
    const originalTrackPageWithTime = tracking.trackPageWithTime;

    // Override tracking functions to add debug logging
    tracking.trackPage = () => {
      console.log('📊 Analytics: Tracking page view', tracking.getCurrentPageInfo());
      return originalTrackPage();
    };

    tracking.trackPageWithTime = () => {
      console.log('📊 Analytics: Tracking page view with time', tracking.getCurrentPageInfo());
      return originalTrackPageWithTime();
    };

    return () => {
      tracking.trackPage = originalTrackPage;
      tracking.trackPageWithTime = originalTrackPageWithTime;
    };
  }, [debug, isClient, tracking]);

  // Don't render anything if tracking is disabled or not on client
  if (!isClient || !enabled || !isTrackingEnabled()) {
    return null;
  }

  // This component doesn't render any visible UI
  // It only handles tracking logic
  return null;
}

/**
 * Basic Analytics Tracker with minimal configuration
 * Good for most use cases
 */
export function BasicAnalyticsTracker({ debug = false }: { debug?: boolean }) {
  return (
    <AnalyticsTracker
      trackingOptions={{
        trackRouteChanges: true,
        trackTimeSpent: false,
        debounceDelay: 1000,
        trackVisibilityChanges: false,
      }}
      debug={debug}
      enabled={true}
    />
  );
}

/**
 * Advanced Analytics Tracker with comprehensive tracking
 * Includes time tracking and visibility changes
 */
export function AdvancedAnalyticsTracker({ debug = false }: { debug?: boolean }) {
  return (
    <AnalyticsTracker
      trackingOptions={{
        trackRouteChanges: true,
        trackTimeSpent: true,
        debounceDelay: 1000,
        trackVisibilityChanges: true,
      }}
      debug={debug}
      enabled={true}
    />
  );
}

/**
 * Conditional Analytics Tracker
 * Only tracks in production or when explicitly enabled
 */
export function ConditionalAnalyticsTracker({ 
  debug = false,
  enableInDevelopment = false 
}: { 
  debug?: boolean;
  enableInDevelopment?: boolean;
}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldTrack = isProduction || enableInDevelopment;

  return (
    <AnalyticsTracker
      trackingOptions={{
        trackRouteChanges: true,
        trackTimeSpent: false,
        debounceDelay: 1000,
        trackVisibilityChanges: false,
      }}
      debug={debug}
      enabled={shouldTrack}
    />
  );
}

/**
 * Analytics Provider Component
 * Provides analytics context and tracking capabilities
 * Can be used to wrap parts of the app that need analytics
 */
export function AnalyticsProvider({ 
  children,
  trackingOptions,
  debug = false 
}: {
  children: React.ReactNode;
  trackingOptions?: UsePageTrackingOptions;
  debug?: boolean;
}) {
  return (
    <>
      <AnalyticsTracker 
        trackingOptions={trackingOptions}
        debug={debug}
      />
      {children}
    </>
  );
}
