"use client";

import { AnalyticsGlobe } from "@/components/analytics/analytics-globe";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function TestGlobePage() {
  const { data, isLoading, error, refetch } = useAnalyticsData({
    period: 'all',
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  // Sample fallback data for testing when API is not available
  const sampleCountries = {
    "Indonesia": 150,
    "United States": 89,
    "India": 67,
    "Brazil": 45,
    "Germany": 34,
    "Japan": 28,
    "United Kingdom": 25,
    "France": 22,
    "Australia": 18,
    "Canada": 15,
    "South Korea": 12,
    "Netherlands": 10,
    "Singapore": 8,
    "Thailand": 6,
    "Malaysia": 5
  };

  const sampleCities = {
    "Jakarta": 45,
    "New York": 32,
    "Mumbai": 28,
    "São Paulo": 25,
    "Berlin": 20,
    "Tokyo": 18,
    "London": 15,
    "Paris": 12,
    "Sydney": 10,
    "Toronto": 8
  };

  // Use real data if available, otherwise use sample data
  const countries = data?.countries && Object.keys(data.countries).length > 0
    ? data.countries
    : sampleCountries;

  const cities = data?.cities && Object.keys(data.cities).length > 0
    ? data.cities
    : sampleCities;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Magic UI Globe Test</h1>
              <p className="text-muted-foreground mt-2">
                Testing Magic UI Globe with real analytics data (427 x 608 dimensions)
              </p>
            </div>
            <Button
              onClick={refetch}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">API Error</CardTitle>
              <CardDescription>
                {error} - Using sample data for demonstration.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-6">
          <AnalyticsGlobe
            countries={countries}
            cities={cities}
            period="all"
          />

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Globe dimensions: 427px × 608px</li>
                  <li>• Click globe to explore countries</li>
                  <li>• Markers show visitor distribution</li>
                  <li>• Notifications appear on interaction</li>
                  <li>• Real-time data from analytics API</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Data Source:</span>
                    <span className={data?.countries ? "text-green-600" : "text-orange-600"}>
                      {data?.countries ? "Live API" : "Sample Data"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Countries:</span>
                    <span>{Object.keys(countries).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Visitors:</span>
                    <span>{Object.values(countries).reduce((sum, count) => sum + count, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <span className={isLoading ? "text-blue-600" : "text-green-600"}>
                      {isLoading ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
