"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface PaymentMethodPieProps {
  data: PaymentMethodBreakdown[] | null;
  isLoading: boolean;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function PaymentMethodPie({ data, isLoading }: PaymentMethodPieProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data untuk ditampilkan
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for pie chart
  const chartData = data.map((item) => ({
    name: item.method,
    value: item.count,
    amount: item.amount,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Metode Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const firstPayload = payload[0];
                if (!firstPayload) return null;
                const data = firstPayload.payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium mb-2">{data.name}</p>
                    <div className="space-y-1 text-sm">
                      <p>Transaksi: {data.value.toLocaleString("id-ID")}</p>
                      <p>Total: {formatCurrency(data.amount)}</p>
                      <p className="text-muted-foreground">
                        {data.percentage.toFixed(1)}% dari total
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const data = chartData.find((d) => d.name === value);
                return `${value} (${data?.value || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary List */}
        <div className="mt-6 space-y-2">
          {data.map((item, index) => (
            <div
              key={item.method}
              className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{item.method}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(item.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {item.count} transaksi ({item.percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

