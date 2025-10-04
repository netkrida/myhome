"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DeviceData {
  [key: string]: number;
}

interface DeviceChartProps {
  data: DeviceData;
  period: string;
}

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile", 
    color: "var(--chart-2)",
  },
  tablet: {
    label: "Tablet",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function DeviceChart({ data, period }: DeviceChartProps) {
  const [activeChart, setActiveChart] = React.useState<string>("desktop")

  // Transform data for chart
  const chartData = React.useMemo(() => {
    return Object.entries(data).map(([device, count]) => ({
      device,
      visitors: count,
      fill: `var(--color-${device})` || "var(--chart-1)"
    }));
  }, [data]);

  // Calculate totals
  const total = React.useMemo(() => {
    return Object.entries(data).reduce((acc, [device, count]) => {
      acc[device] = count;
      return acc;
    }, {} as { [key: string]: number });
  }, [data]);

  // Get available devices
  const availableDevices = Object.keys(data);

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Device Analytics</CardTitle>
          <CardDescription>
            Showing device breakdown for {period}
          </CardDescription>
        </div>
        <div className="flex">
          {availableDevices.map((device) => {
            return (
              <button
                key={device}
                data-active={activeChart === device}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(device)}
              >
                <span className="text-muted-foreground text-xs capitalize">
                  {device}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[device]?.toLocaleString() || 0}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="device"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="visitors"
                  labelFormatter={(value) => {
                    return value.charAt(0).toUpperCase() + value.slice(1);
                  }}
                />
              }
            />
            <Bar 
              dataKey="visitors" 
              fill={activeChart ? `var(--color-${activeChart})` : "var(--chart-1)"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
