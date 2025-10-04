"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

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

interface BrowserData {
  [key: string]: number;
}

interface SummaryPieChartProps {
  data: BrowserData;
  period: string;
}

const chartConfig = {
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function SummaryPieChart({ data, period }: SummaryPieChartProps) {
  const chartData = React.useMemo(() => {
    return Object.entries(data).map(([browser, count]) => ({
      browser,
      visitors: count,
      fill: `var(--color-${browser})` || "var(--chart-1)"
    }));
  }, [data]);

  const totalVisitors = React.useMemo(() => {
    return Object.values(data).reduce((sum, count) => sum + count, 0);
  }, [data]);

  const topBrowser = React.useMemo(() => {
    const entries = Object.entries(data);
    if (entries.length === 0) return { name: "None", percentage: 0 };

    const [name, count] = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    const percentage = totalVisitors > 0 ? ((count / totalVisitors) * 100).toFixed(1) : 0;
    return { name: name.charAt(0).toUpperCase() + name.slice(1), percentage };
  }, [data, totalVisitors]);

  const formatPeriod = (period: string) => {
    switch (period) {
      case 'today': return 'today';
      case 'week': return 'this week';
      case 'month': return 'this month';
      case 'year': return 'this year';
      default: return 'all time';
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Browser Distribution</CardTitle>
        <CardDescription>Browser usage for {formatPeriod(period)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <LabelList
                dataKey="browser"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value: string) =>
                  value.charAt(0).toUpperCase() + value.slice(1)
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {topBrowser.name} leads with {topBrowser.percentage}% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex flex-wrap items-center gap-4 leading-none text-muted-foreground">
          {Object.entries(data).map(([browser, count], index) => (
            <div key={browser} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full bg-chart-${index + 1}`}></div>
              <span className="capitalize">{browser}: {count}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
