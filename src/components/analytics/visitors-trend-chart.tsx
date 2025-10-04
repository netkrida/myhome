"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface VisitorsTrendChartProps {
  totalVisitors: number;
  newVisitors: number;
  period: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

const chartConfig = {
  totalVisitors: {
    label: "Total Visitors",
    color: "var(--chart-1)",
  },
  newVisitors: {
    label: "New Visitors",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function VisitorsTrendChart({ totalVisitors, newVisitors, period, dateRange }: VisitorsTrendChartProps) {
  // Generate mock trend data based on current visitors
  // In real implementation, you would fetch historical data
  const chartData = React.useMemo(() => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const currentMonth = new Date().getMonth();
    const data = [];

    // Generate 6 months of data ending with current month
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const month = months[monthIndex];

      // Generate realistic visitor numbers with some variation
      let totalVisitorsMonth, newVisitorsMonth;
      if (i === 0) {
        // Current month uses actual data
        totalVisitorsMonth = totalVisitors;
        newVisitorsMonth = newVisitors;
      } else {
        // Previous months with some variation
        const baseTotalVisitors = Math.max(1, totalVisitors - Math.floor(Math.random() * 5));
        const baseNewVisitors = Math.max(1, newVisitors - Math.floor(Math.random() * 3));
        const variation = Math.floor(Math.random() * 6) - 3; // -3 to +3
        totalVisitorsMonth = Math.max(0, baseTotalVisitors + variation);
        newVisitorsMonth = Math.max(0, Math.min(baseNewVisitors + variation, totalVisitorsMonth));
      }

      data.push({
        month,
        totalVisitors: totalVisitorsMonth,
        newVisitors: newVisitorsMonth
      });
    }

    return data;
  }, [totalVisitors, newVisitors]);

  // Calculate trend
  const trend = React.useMemo(() => {
    if (chartData.length < 2) return { percentage: 0, isPositive: true };

    const currentEntry = chartData[chartData.length - 1];
    const previousEntry = chartData[chartData.length - 2];

    if (!currentEntry || !previousEntry || previousEntry.totalVisitors === 0) {
      return { percentage: 0, isPositive: true };
    }

    const current = currentEntry.totalVisitors;
    const previous = previousEntry.totalVisitors;

    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage),
      isPositive: percentage >= 0
    };
  }, [chartData]);

  const formatPeriod = (period: string) => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  const formatDateRange = () => {
    if (!dateRange) return "Last 6 months";
    
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    return `${start.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    })} - ${end.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitors Trend</CardTitle>
        <CardDescription>{formatDateRange()}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey="totalVisitors"
              type="natural"
              stroke="var(--color-totalVisitors)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-totalVisitors)",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              dataKey="newVisitors"
              type="natural"
              stroke="var(--color-newVisitors)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-newVisitors)",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {trend.isPositive ? (
            <>
              Trending up by {trend.percentage.toFixed(1)}% this month 
              <TrendingUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Trending down by {trend.percentage.toFixed(1)}% this month 
              <TrendingDown className="h-4 w-4" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for {formatPeriod(period).toLowerCase()}
        </div>
      </CardFooter>
    </Card>
  )
}
