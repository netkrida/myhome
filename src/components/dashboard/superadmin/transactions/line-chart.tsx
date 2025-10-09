"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface TimeSeriesDataPoint {
  date: string;
  revenue: number;
  count: number;
}

interface TransactionsLineChartProps {
  data: TimeSeriesDataPoint[] | null;
  isLoading: boolean;
  granularity: "day" | "week" | "month";
  onGranularityChange: (value: "day" | "week" | "month") => void;
}

export function TransactionsLineChart({
  data,
  isLoading,
  granularity,
  onGranularityChange,
}: TransactionsLineChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tren Transaksi
            </CardTitle>
            <Select value={granularity} onValueChange={onGranularityChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Harian</SelectItem>
                <SelectItem value="week">Mingguan</SelectItem>
                <SelectItem value="month">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data untuk ditampilkan
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((point) => ({
    ...point,
    dateFormatted: format(new Date(point.date), "dd MMM", { locale: localeId }),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tren Transaksi
          </CardTitle>
          <Select value={granularity} onValueChange={onGranularityChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Harian</SelectItem>
              <SelectItem value="week">Mingguan</SelectItem>
              <SelectItem value="month">Bulanan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateFormatted"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const firstPayload = payload[0];
                const secondPayload = payload[1];
                if (!firstPayload || !secondPayload) return null;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium mb-2">
                      {firstPayload.payload.dateFormatted}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Revenue: {formatCurrency(firstPayload.value as number)}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Transaksi: {secondPayload.value}
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => {
                if (value === "revenue") return "Revenue (Rp)";
                if (value === "count") return "Jumlah Transaksi";
                return value;
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

