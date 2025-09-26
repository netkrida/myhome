"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { checkSessionHealth, validateSession, clearInvalidSession } from "@/lib/auth-utils";

interface UseSessionHealthOptions {
  /**
   * Interval in milliseconds to check session health
   * Default: 5 minutes (300000ms)
   */
  checkInterval?: number;
  
  /**
   * Whether to check session health on route changes
   * Default: true
   */
  checkOnRouteChange?: boolean;
  
  /**
   * Whether to check session health on window focus
   * Default: true
   */
  checkOnFocus?: boolean;
  
  /**
   * Whether to automatically redirect on invalid session
   * Default: true
   */
  autoRedirect?: boolean;
  
  /**
   * Callback when session becomes invalid
   */
  onSessionInvalid?: (reason?: string) => void;
  
  /**
   * Callback when session validation fails
   */
  onValidationError?: (error: any) => void;
}

/**
 * Hook to monitor session health and automatically handle invalid sessions
 */
export function useSessionHealth(options: UseSessionHealthOptions = {}) {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes
    checkOnRouteChange = true,
    checkOnFocus = true,
    autoRedirect = true,
    onSessionInvalid,
    onValidationError
  } = options;

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef<boolean>(false);

  /**
   * Perform session health check
   */
  const performHealthCheck = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) {
      console.log("🔍 Session Health - Check already in progress, skipping");
      return;
    }

    // Skip if no session
    if (status !== "authenticated" || !session?.user?.id) {
      console.log("🔍 Session Health - No authenticated session, skipping check");
      return;
    }

    // Throttle checks (minimum 30 seconds between checks)
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      console.log("🔍 Session Health - Throttling check, too soon since last check");
      return;
    }

    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      console.log("🔍 Session Health - Performing health check for user:", session.user.id);

      const validation = await validateSession();

      if (!validation.valid) {
        console.log("❌ Session Health - Session is invalid:", validation.reason);

        // Call callback if provided
        if (onSessionInvalid) {
          onSessionInvalid(validation.reason);
        }

        if (autoRedirect) {
          console.log("🔄 Session Health - Auto-redirecting to login");
          await clearInvalidSession(pathname);
        }

        return false;
      }

      console.log("✅ Session Health - Session is healthy");
      return true;

    } catch (error) {
      console.error("❌ Session Health - Error during health check:", error);

      if (onValidationError) {
        onValidationError(error);
      }

      return false;
    } finally {
      isCheckingRef.current = false;
    }
  }, [session, status, pathname, onSessionInvalid, onValidationError, autoRedirect]);

  /**
   * Handle window focus event
   */
  const handleWindowFocus = useCallback(() => {
    if (checkOnFocus) {
      console.log("🔍 Session Health - Window focused, checking session");
      performHealthCheck();
    }
  }, [checkOnFocus, performHealthCheck]);

  /**
   * Setup periodic health checks
   */
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && checkInterval > 0) {
      console.log("🔍 Session Health - Setting up periodic checks every", checkInterval, "ms");

      intervalRef.current = setInterval(() => {
        console.log("⏰ Session Health - Periodic check triggered");
        performHealthCheck();
      }, checkInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [status, session, checkInterval, performHealthCheck]);

  /**
   * Check on route changes
   */
  useEffect(() => {
    if (checkOnRouteChange && status === "authenticated" && session?.user?.id) {
      console.log("🔍 Session Health - Route changed to:", pathname);
      performHealthCheck();
    }
  }, [pathname, checkOnRouteChange, status, session, performHealthCheck]);

  /**
   * Setup window focus listener
   */
  useEffect(() => {
    if (checkOnFocus) {
      window.addEventListener("focus", handleWindowFocus);
      return () => {
        window.removeEventListener("focus", handleWindowFocus);
      };
    }
  }, [checkOnFocus, handleWindowFocus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    /**
     * Manually trigger a session health check
     */
    checkHealth: performHealthCheck,
    
    /**
     * Whether a health check is currently in progress
     */
    isChecking: isCheckingRef.current,
    
    /**
     * Timestamp of the last health check
     */
    lastCheck: lastCheckRef.current
  };
}

/**
 * Simple hook that just ensures session health on mount and route changes
 */
export function useSessionGuard() {
  return useSessionHealth({
    checkInterval: 5 * 60 * 1000, // 5 minutes
    checkOnRouteChange: true,
    checkOnFocus: true,
    autoRedirect: true
  });
}
