"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  trackPageView, 
  debounce, 
  isTrackingEnabled,
  getPageInfo 
} from '@/lib/analytics-utils';

export interface UsePageTrackingOptions {
  /**
   * Enable automatic tracking on route changes
   * @default true
   */
  trackRouteChanges?: boolean;
  
  /**
   * Enable tracking time spent on page
   * @default false
   */
  trackTimeSpent?: boolean;
  
  /**
   * Debounce delay for tracking calls in milliseconds
   * @default 1000
   */
  debounceDelay?: number;
  
  /**
   * Enable tracking on page visibility changes (focus/blur)
   * @default false
   */
  trackVisibilityChanges?: boolean;
}

/**
 * Hook for automatic page tracking
 * Tracks page views, route changes, and optionally time spent
 */
export function usePageTracking(options: UsePageTrackingOptions = {}) {
  const {
    trackRouteChanges = true,
    trackTimeSpent = false,
    debounceDelay = 1000,
    trackVisibilityChanges = false,
  } = options;

  const pathname = usePathname();
  const pageStartTime = useRef<number>(Date.now());
  const lastTrackedPath = useRef<string>('');
  const isInitialized = useRef<boolean>(false);

  // Debounced tracking function
  const debouncedTrackPageView = useCallback(
    debounce((timeSpent?: number) => {
      if (!isTrackingEnabled()) {
        return;
      }

      trackPageView(timeSpent).catch((error) => {
        console.warn('Page tracking failed:', error);
      });
    }, debounceDelay),
    [debounceDelay]
  );

  // Track page view with optional time spent calculation
  const trackCurrentPage = useCallback((includeTimeSpent: boolean = false) => {
    const currentTime = Date.now();
    let timeSpent: number | undefined;

    if (includeTimeSpent && trackTimeSpent) {
      timeSpent = Math.round((currentTime - pageStartTime.current) / 1000); // in seconds
    }

    // Update page start time for next calculation
    pageStartTime.current = currentTime;

    // Track the page view
    debouncedTrackPageView(timeSpent);
  }, [debouncedTrackPageView, trackTimeSpent]);

  // Handle route changes
  useEffect(() => {
    if (!trackRouteChanges) {
      return;
    }

    // Skip if this is the same path as last tracked
    if (lastTrackedPath.current === pathname) {
      return;
    }

    // Track previous page with time spent if this is not the initial load
    if (isInitialized.current && lastTrackedPath.current) {
      trackCurrentPage(true);
    }

    // Small delay to ensure page title and other info are updated
    const timeoutId = setTimeout(() => {
      trackCurrentPage(false);
      lastTrackedPath.current = pathname;
      isInitialized.current = true;
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, trackRouteChanges, trackCurrentPage]);

  // Handle page visibility changes (focus/blur)
  useEffect(() => {
    if (!trackVisibilityChanges) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden, track time spent
        trackCurrentPage(true);
      } else {
        // Page is being shown, reset timer
        pageStartTime.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      // Track time spent before page unload
      trackCurrentPage(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackVisibilityChanges, trackCurrentPage]);

  // Initial page load tracking
  useEffect(() => {
    // Only track on initial mount
    if (!isInitialized.current) {
      const timeoutId = setTimeout(() => {
        trackCurrentPage(false);
        lastTrackedPath.current = pathname;
        isInitialized.current = true;
      }, 500); // Slightly longer delay for initial load

      return () => clearTimeout(timeoutId);
    }
  }, []); // Empty dependency array for initial load only

  // Return tracking functions for manual use
  return {
    /**
     * Manually track current page
     */
    trackPage: () => trackCurrentPage(false),
    
    /**
     * Manually track current page with time spent
     */
    trackPageWithTime: () => trackCurrentPage(true),
    
    /**
     * Get current page info
     */
    getCurrentPageInfo: getPageInfo,
    
    /**
     * Check if tracking is enabled
     */
    isEnabled: isTrackingEnabled(),
  };
}

/**
 * Simplified hook for basic page tracking
 * Uses default options for most common use case
 */
export function useBasicPageTracking() {
  return usePageTracking({
    trackRouteChanges: true,
    trackTimeSpent: false,
    debounceDelay: 1000,
    trackVisibilityChanges: false,
  });
}

/**
 * Advanced hook for comprehensive page tracking
 * Includes time tracking and visibility changes
 */
export function useAdvancedPageTracking() {
  return usePageTracking({
    trackRouteChanges: true,
    trackTimeSpent: true,
    debounceDelay: 1000,
    trackVisibilityChanges: true,
  });
}
