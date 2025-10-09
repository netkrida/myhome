import { requireRole, getCurrentUserContext } from "@/server/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Suspense } from "react";
import { SummaryCards } from "@/components/dashboard/adminkos/summary-cards";
import { TodayActivity } from "@/components/dashboard/adminkos/today-activity";
import { RevenueChart } from "@/components/dashboard/adminkos/revenue-chart";
import { PaymentTypeChart } from "@/components/dashboard/adminkos/payment-type-chart";
import { MyProperties } from "@/components/dashboard/adminkos/my-properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminKosAPI } from "@/server/api/adminkos.api";
import type {
  AdminKosSummaryDTO,
  TodayActivityDTO,
  RevenueChartDTO,
  PaymentTypeBreakdownDTO,
  MyPropertiesDTO,
} from "@/server/types/adminkos";

// Loading components
function SummaryCardsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

function ActivityLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Data fetching functions - call service layer directly
async function getSummaryData(): Promise<AdminKosSummaryDTO> {
  try {
    const result = await AdminKosAPI.getSummary();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch summary");
    }

    return result.data!;
  } catch (error) {
    console.error("Error fetching summary:", error);
    // Return empty data on error
    return {
      totalActiveProperties: 0,
      totalRooms: 0,
      availableRooms: 0,
      occupancyRate: 0,
      activeBookings: 0,
      revenueThisMonth: 0,
      depositReceivedThisMonth: 0,
      pendingPayments: 0,
    };
  }
}

async function getTodayActivityData(): Promise<TodayActivityDTO> {
  try {
    const result = await AdminKosAPI.getTodayActivity();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch activity");
    }

    return result.data!;
  } catch (error) {
    console.error("Error fetching activity:", error);
    return {
      checkInsToday: [],
      checkOutsToday: [],
      pendingPayments: [],
    };
  }
}

async function getRevenueData(): Promise<RevenueChartDTO> {
  try {
    const result = await AdminKosAPI.getRevenueChart();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch revenue");
    }

    return result.data!;
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return { months: [] };
  }
}

async function getPaymentBreakdownData(): Promise<PaymentTypeBreakdownDTO> {
  try {
    const result = await AdminKosAPI.getPaymentTypeBreakdown();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch payment breakdown");
    }

    return result.data!;
  } catch (error) {
    console.error("Error fetching payment breakdown:", error);
    return { deposit: 0, full: 0, totalAmount: 0 };
  }
}

async function getMyPropertiesData(): Promise<MyPropertiesDTO> {
  try {
    const result = await AdminKosAPI.getMyProperties();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch properties");
    }

    return result.data!;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return { properties: [] };
  }
}

export default async function AdminKosDashboard() {
  // Ensure user has adminkos role
  await requireRole(["ADMINKOS"]);

  // Fetch all data in parallel
  const [summaryData, activityData, revenueData, paymentBreakdownData, propertiesData] =
    await Promise.all([
      getSummaryData(),
      getTodayActivityData(),
      getRevenueData(),
      getPaymentBreakdownData(),
      getMyPropertiesData(),
    ]);

  return (
    <DashboardLayout title="Dashboard Admin Kos">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin Kos</h1>
          <p className="text-muted-foreground">
            Kelola properti, booking, dan operasional bisnis Anda
          </p>
        </div>

        {/* Summary Cards */}
        <Suspense fallback={<SummaryCardsLoading />}>
          <SummaryCards data={summaryData} />
        </Suspense>

        {/* Today's Activity */}
        <Suspense fallback={<ActivityLoading />}>
          <TodayActivity data={activityData} />
        </Suspense>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartLoading />}>
            <RevenueChart data={revenueData} />
          </Suspense>
          <Suspense fallback={<ChartLoading />}>
            <PaymentTypeChart data={paymentBreakdownData} />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}
