"use client";

import { useEffect, useState } from "react";
import { useSessionHealth } from "@/hooks/useSessionHealth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconRefresh, IconLoader2 } from "@tabler/icons-react";
import { clearInvalidSession } from "@/lib/auth-utils";

interface SessionHealthMonitorProps {
  /**
   * Whether to show visual indicators
   * Default: true
   */
  showIndicators?: boolean;
  
  /**
   * Whether to show manual refresh button
   * Default: true
   */
  showRefreshButton?: boolean;
  
  /**
   * Custom class name for the container
   */
  className?: string;
  
  /**
   * Callback when session becomes invalid
   */
  onSessionInvalid?: () => void;
}

/**
 * Component that monitors session health and provides user feedback
 */
export function SessionHealthMonitor({
  showIndicators = true,
  showRefreshButton = true,
  className = "",
  onSessionInvalid
}: SessionHealthMonitorProps) {
  const [lastError, setLastError] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const { checkHealth, isChecking, lastCheck } = useSessionHealth({
    checkInterval: 5 * 60 * 1000, // 5 minutes
    checkOnRouteChange: true,
    checkOnFocus: true,
    autoRedirect: true,
    onSessionInvalid: (reason) => {
      console.log("🔍 Session Health Monitor - Session invalid:", reason);
      setLastError(reason || "Session is invalid");
      if (onSessionInvalid) {
        onSessionInvalid();
      }
    },
    onValidationError: (error) => {
      console.error("❌ Session Health Monitor - Validation error:", error);
      setLastError("Error validating session");
    }
  });

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    setLastError(null);
    
    try {
      console.log("🔄 Session Health Monitor - Manual refresh triggered");
      const isHealthy = await checkHealth();
      
      if (!isHealthy) {
        console.log("❌ Session Health Monitor - Manual refresh detected unhealthy session");
        // The hook will handle the redirect
      } else {
        console.log("✅ Session Health Monitor - Manual refresh confirmed healthy session");
      }
    } catch (error) {
      console.error("❌ Session Health Monitor - Error during manual refresh:", error);
      setLastError("Error during manual session check");
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Clear error after some time
  useEffect(() => {
    if (lastError) {
      const timer = setTimeout(() => {
        setLastError(null);
      }, 10000); // Clear error after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [lastError]);

  if (!showIndicators && !showRefreshButton) {
    return null; // Silent monitoring mode
  }

  return (
    <div className={`session-health-monitor ${className}`}>
      {/* Error Alert */}
      {lastError && showIndicators && (
        <Alert variant="destructive" className="mb-4">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Session Error: {lastError}
            <Button
              variant="link"
              size="sm"
              className="ml-2 p-0 h-auto"
              onClick={() => clearInvalidSession()}
            >
              Clear Session
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Indicators */}
      {showIndicators && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* Health Check Status */}
          <div className="flex items-center gap-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                lastError 
                  ? 'bg-red-500' 
                  : isChecking || isManualRefreshing
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-green-500'
              }`}
            />
            <span>
              {lastError 
                ? 'Session Error' 
                : isChecking || isManualRefreshing
                  ? 'Checking...'
                  : 'Session OK'
              }
            </span>
          </div>

          {/* Last Check Time */}
          {lastCheck > 0 && (
            <span className="text-xs">
              Last check: {new Date(lastCheck).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Manual Refresh Button */}
      {showRefreshButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isChecking || isManualRefreshing}
          className="mt-2"
        >
          {(isChecking || isManualRefreshing) && (
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {!isChecking && !isManualRefreshing && (
            <IconRefresh className="mr-2 h-4 w-4" />
          )}
          {isChecking || isManualRefreshing ? 'Checking...' : 'Check Session'}
        </Button>
      )}
    </div>
  );
}

/**
 * Minimal session health indicator for headers/navbars
 */
export function SessionHealthIndicator({ className = "" }: { className?: string }) {
  return (
    <SessionHealthMonitor
      showIndicators={true}
      showRefreshButton={false}
      className={className}
    />
  );
}

/**
 * Full session health panel for settings/debug pages
 */
export function SessionHealthPanel({ className = "" }: { className?: string }) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);

  const loadDebugInfo = async () => {
    setIsLoadingDebug(true);
    try {
      const response = await fetch("/api/auth/validate-session");
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Error loading debug info:", error);
      setDebugInfo({ error: "Failed to load debug info" });
    } finally {
      setIsLoadingDebug(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <SessionHealthMonitor
        showIndicators={true}
        showRefreshButton={true}
      />
      
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Session Debug Info</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDebugInfo}
            disabled={isLoadingDebug}
          >
            {isLoadingDebug && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
        
        {debugInfo && (
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
