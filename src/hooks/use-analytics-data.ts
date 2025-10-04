"use client";

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalVisitors: number;
  period: string;
  countries: { [key: string]: number };
  cities: { [key: string]: number };
  devices: { [key: string]: number };
  browsers: { [key: string]: number };
  operatingSystems: { [key: string]: number };
  summary: {
    totalVisitors: number;
    returningVisitors: number;
    newVisitors: number;
    totalPageViews: number;
    uniqueCountries: number;
    uniqueCities: number;
    uniqueDevices: number;
    uniqueBrowsers: number;
    uniqueOperatingSystems: number;
  };
}

interface UseAnalyticsDataOptions {
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useAnalyticsData(options: UseAnalyticsDataOptions = {}) {
  const {
    period = 'all',
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/analytics/visitors/total?period=${period}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. SUPERADMIN role required.');
        }
        throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
      }

      const analyticsData: AnalyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      
      // Set fallback data for development/testing
      setData({
        totalVisitors: 0,
        period,
        countries: {},
        cities: {},
        devices: {},
        browsers: {},
        operatingSystems: {},
        summary: {
          totalVisitors: 0,
          returningVisitors: 0,
          newVisitors: 0,
          totalPageViews: 0,
          uniqueCountries: 0,
          uniqueCities: 0,
          uniqueDevices: 0,
          uniqueBrowsers: 0,
          uniqueOperatingSystems: 0,
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalyticsData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, period]);

  const refetch = () => {
    setIsLoading(true);
    fetchAnalyticsData();
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
}
