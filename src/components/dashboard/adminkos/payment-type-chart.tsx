"use client";

import * as React from "react";
import { Pie, PieChart, Cell, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PaymentTypeBreakdownDTO } from "@/server/types/adminkos";

interface PaymentTypeChartProps {
  data: PaymentTypeBreakdownDTO;
}

const chartConfig = {
  deposit: {
    label: "Deposit",
    color: "var(--chart-2)",
  },
  full: {
    label: "Pembayaran Penuh",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const COLORS = {
  deposit: "var(--chart-2)",
  full: "var(--chart-1)",
};

export function PaymentTypeChart({ data }: PaymentTypeChartProps) {
  // Transform data for chart
  const chartData = React.useMemo(() => {
    return [
      {
        name: "Deposit",
        value: data.deposit,
        fill: COLORS.deposit,
      },
      {
        name: "Pembayaran Penuh",
        value: data.full,
        fill: COLORS.full,
      },
    ].filter((item) => item.value > 0); // Only show non-zero values
  }, [data]);

  // Calculate percentages
  const percentages = React.useMemo(() => {
    if (data.totalAmount === 0) {
      return { deposit: 0, full: 0 };
    }
    return {
      deposit: (data.deposit / data.totalAmount) * 100,
      full: (data.full / data.totalAmount) * 100,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Breakdown Tipe Pembayaran</CardTitle>
        <CardDescription>
          Bulan ini:{" "}
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(data.totalAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Belum ada pembayaran bulan ini
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto h-[250px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
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
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Summary */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.deposit }} />
                  <span>Deposit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(data.deposit)}
                  </span>
                  <span className="text-muted-foreground">
                    ({percentages.deposit.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.full }} />
                  <span>Pembayaran Penuh</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(data.full)}
                  </span>
                  <span className="text-muted-foreground">
                    ({percentages.full.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

