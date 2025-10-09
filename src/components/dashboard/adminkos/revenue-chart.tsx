"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RevenueChartDTO } from "@/server/types/adminkos";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueChartProps {
  data: RevenueChartDTO;
}

const chartConfig = {
  totalRevenue: {
    label: "Total Pendapatan",
    color: "var(--chart-1)",
  },
  depositRevenue: {
    label: "Deposit",
    color: "var(--chart-2)",
  },
  fullRevenue: {
    label: "Pembayaran Penuh",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function RevenueChart({ data }: RevenueChartProps) {
  // Transform data for chart
  const chartData = React.useMemo(() => {
    return data.months.map((month) => {
      // Parse month string (e.g., "2024-01") to readable format
      const [year, monthNum] = month.month.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const monthIndex = monthNum ? parseInt(monthNum) - 1 : 0;
      const monthLabel = `${monthNames[monthIndex] || 'Unknown'} ${year || ''}`;

      return {
        month: monthLabel,
        totalRevenue: month.totalRevenue,
        depositRevenue: month.depositRevenue,
        fullRevenue: month.fullRevenue,
        transactionCount: month.transactionCount,
      };
    });
  }, [data.months]);

  // Calculate trend
  const trend = React.useMemo(() => {
    if (chartData.length < 2) {
      return { isPositive: true, percentage: 0 };
    }

    const currentMonthData = chartData[chartData.length - 1];
    const previousMonthData = chartData[chartData.length - 2];

    if (!currentMonthData || !previousMonthData) {
      return { isPositive: true, percentage: 0 };
    }

    const currentMonth = currentMonthData.totalRevenue;
    const previousMonth = previousMonthData.totalRevenue;

    if (previousMonth === 0) {
      return { isPositive: currentMonth > 0, percentage: 100 };
    }

    const change = ((currentMonth - previousMonth) / previousMonth) * 100;
    return {
      isPositive: change >= 0,
      percentage: Math.abs(change),
    };
  }, [chartData]);

  // Calculate total revenue
  const totalRevenue = React.useMemo(() => {
    return chartData.reduce((sum, month) => sum + month.totalRevenue, 0);
  }, [chartData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendapatan 12 Bulan Terakhir</CardTitle>
        <CardDescription>
          Total:{" "}
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(totalRevenue)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[200px]"
                  labelFormatter={(value) => value}
                  formatter={(value) =>
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(value as number)
                  }
                />
              }
            />
            <Area
              dataKey="depositRevenue"
              type="monotone"
              fill="var(--color-depositRevenue)"
              fillOpacity={0.4}
              stroke="var(--color-depositRevenue)"
              stackId="a"
            />
            <Area
              dataKey="fullRevenue"
              type="monotone"
              fill="var(--color-fullRevenue)"
              fillOpacity={0.4}
              stroke="var(--color-fullRevenue)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trend.isPositive ? (
            <>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-600 font-medium">
                +{trend.percentage.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-rose-600" />
              <span className="text-rose-600 font-medium">
                -{trend.percentage.toFixed(1)}%
              </span>
            </>
          )}
          <span className="text-muted-foreground">dari bulan lalu</span>
        </div>
      </CardContent>
    </Card>
  );
}

