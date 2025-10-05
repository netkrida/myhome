"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePageTracking } from '@/hooks/use-page-tracking';
import { getDeviceInfo, getPageInfo, getVisitorId, isTrackingEnabled } from '@/lib/analytics-utils';

/**
 * Manual Analytics Tracker Component
 * Provides UI for manually triggering analytics tracking
 * Useful for testing and debugging
 */
export function ManualTracker() {
  const [lastTrackTime, setLastTrackTime] = useState<string>('');
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'tracking' | 'success' | 'error'>('idle');
  
  const tracking = usePageTracking({
    trackRouteChanges: false, // Disable automatic tracking for manual control
    trackTimeSpent: true,
    debounceDelay: 500,
  });

  const handleTrackPage = async () => {
    setTrackingStatus('tracking');
    
    try {
      await tracking.trackPage();
      setTrackingStatus('success');
      setLastTrackTime(new Date().toLocaleTimeString());
      
      setTimeout(() => setTrackingStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual tracking failed:', error);
      setTrackingStatus('error');
      setTimeout(() => setTrackingStatus('idle'), 2000);
    }
  };

  const handleTrackPageWithTime = async () => {
    setTrackingStatus('tracking');
    
    try {
      await tracking.trackPageWithTime();
      setTrackingStatus('success');
      setLastTrackTime(new Date().toLocaleTimeString());
      
      setTimeout(() => setTrackingStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual tracking with time failed:', error);
      setTrackingStatus('error');
      setTimeout(() => setTrackingStatus('idle'), 2000);
    }
  };

  const deviceInfo = getDeviceInfo();
  const pageInfo = getPageInfo();
  const visitorId = getVisitorId();
  const trackingEnabled = isTrackingEnabled();

  const getStatusColor = () => {
    switch (trackingStatus) {
      case 'tracking': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (trackingStatus) {
      case 'tracking': return 'Tracking...';
      case 'success': return 'Success';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Manual Analytics Tracker
          <Badge variant={trackingEnabled ? 'default' : 'destructive'}>
            {trackingEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manually trigger analytics tracking for testing and debugging
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tracking Controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button 
              onClick={handleTrackPage}
              disabled={!trackingEnabled || trackingStatus === 'tracking'}
              variant="outline"
            >
              Track Page View
            </Button>
            
            <Button 
              onClick={handleTrackPageWithTime}
              disabled={!trackingEnabled || trackingStatus === 'tracking'}
              variant="outline"
            >
              Track with Time
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm text-muted-foreground">
              Status: {getStatusText()}
              {lastTrackTime && ` (Last: ${lastTrackTime})`}
            </span>
          </div>
        </div>

        {/* Current Page Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Current Page Info</h4>
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <div><strong>Page:</strong> {pageInfo.page}</div>
            <div><strong>Title:</strong> {pageInfo.title || 'N/A'}</div>
            <div><strong>Referrer:</strong> {pageInfo.referrer || 'N/A'}</div>
          </div>
        </div>

        {/* Device Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Device Info</h4>
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <div><strong>Device:</strong> {deviceInfo.device || 'Unknown'}</div>
            <div><strong>Browser:</strong> {deviceInfo.browser || 'Unknown'}</div>
            <div><strong>OS:</strong> {deviceInfo.os || 'Unknown'}</div>
          </div>
        </div>

        {/* Visitor Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Visitor Info</h4>
          <div className="bg-muted p-3 rounded-md text-sm">
            <div><strong>Visitor ID:</strong> {visitorId}</div>
          </div>
        </div>

        {/* Tracking Status */}
        <div className="space-y-2">
          <h4 className="font-medium">Tracking Status</h4>
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <div><strong>Enabled:</strong> {trackingEnabled ? 'Yes' : 'No'}</div>
            <div><strong>Auto Tracking:</strong> {tracking.isEnabled ? 'Yes' : 'No'}</div>
            <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Manual Tracker for development
 */
export function CompactManualTracker() {
  const [isTracking, setIsTracking] = useState(false);
  
  const tracking = usePageTracking({
    trackRouteChanges: false,
    trackTimeSpent: false,
    debounceDelay: 500,
  });

  const handleQuickTrack = async () => {
    setIsTracking(true);
    
    try {
      await tracking.trackPage();
      console.log('📊 Manual track successful');
    } catch (error) {
      console.error('📊 Manual track failed:', error);
    } finally {
      setIsTracking(false);
    }
  };

  if (!isTrackingEnabled()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleQuickTrack}
        disabled={isTracking}
        size="sm"
        variant="outline"
        className="bg-background/80 backdrop-blur-sm"
      >
        {isTracking ? 'Tracking...' : '📊 Track'}
      </Button>
    </div>
  );
}
