import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsGlobe } from "@/components/analytics/analytics-globe"
import { DeviceChart } from "@/components/analytics/device-chart"
import { VisitorsTrendChart } from "@/components/analytics/visitors-trend-chart"
import { SummaryPieChart } from "@/components/analytics/summary-pie-chart"
import { LoadingGlobe } from "@/components/analytics/loading-globe"
import { Suspense } from "react"

interface AnalyticsData {
  totalVisitors: number;
  period: string;
  dateRange?: {
    start: string;
    end: string;
  };
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

async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Import the service directly instead of using fetch
    const { AnalyticsService } = await import("@/server/services/analytics.service");
    const { AnalyticsRepository } = await import("@/server/repositories/superadmin/analytics.repository");

    // Get total visitors for month period
    const totalVisitors = await AnalyticsService.getTotalVisitors('month');

    // Get visitor analytics summary
    const visitorsSummary = await AnalyticsRepository.getVisitorsSummary();

    return {
      totalVisitors,
      period: 'month',
      countries: visitorsSummary.countries,
      cities: visitorsSummary.cities,
      devices: visitorsSummary.devices,
      browsers: visitorsSummary.browsers,
      operatingSystems: visitorsSummary.operatingSystems,
      summary: {
        totalVisitors: visitorsSummary.totalVisitors,
        returningVisitors: visitorsSummary.returningVisitors,
        newVisitors: visitorsSummary.newVisitors,
        totalPageViews: visitorsSummary.totalPageViews,
        uniqueCountries: Object.keys(visitorsSummary.countries).length,
        uniqueCities: Object.keys(visitorsSummary.cities).length,
        uniqueDevices: Object.keys(visitorsSummary.devices).length,
        uniqueBrowsers: Object.keys(visitorsSummary.browsers).length,
        uniqueOperatingSystems: Object.keys(visitorsSummary.operatingSystems).length,
      },
    };
  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    // Return fallback data
    return {
      totalVisitors: 0,
      period: 'month',
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
      },
    };
  }
}

export default async function SuperadminDashboard() {
  // Ensure user has superadmin role
  await requireRole(["SUPERADMIN"])

  // Fetch analytics data
  const analyticsData = await getAnalyticsData();

  return (
    <DashboardLayout title="Superadmin Dashboard">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.summary.totalVisitors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.summary.newVisitors} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.summary.uniqueCountries}</div>
              <p className="text-xs text-muted-foreground">
                Unique countries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.summary.uniqueDevices}</div>
              <p className="text-xs text-muted-foreground">
                Device types
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Globe and Visitor Trend Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Globe Visualization */}
          <Suspense fallback={<LoadingGlobe />}>
            <AnalyticsGlobe
              countries={analyticsData.countries}
              cities={analyticsData.cities}
              period={analyticsData.period}
            />
          </Suspense>

          {/* Visitors Trend Chart */}
          <VisitorsTrendChart
            totalVisitors={analyticsData.totalVisitors}
            newVisitors={analyticsData.summary.newVisitors}
            period={analyticsData.period}
            dateRange={analyticsData.dateRange}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Device Chart */}
          <DeviceChart
            data={analyticsData.devices}
            period={analyticsData.period}
          />

          {/* Browser Pie Chart */}
          <SummaryPieChart
            data={analyticsData.browsers}
            period={analyticsData.period}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
