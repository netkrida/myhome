"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { LedgerBreakdownResponse } from "@/server/types/ledger";

interface BreakdownChartsProps {
  data: LedgerBreakdownResponse;
  isLoading?: boolean;
}

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
];

export function BreakdownCharts({ data, isLoading }: BreakdownChartsProps) {
  if (isLoading) {
    return <BreakdownChartsSkeleton />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-1">{data.accountName}</p>
          <p className="text-sm text-muted-foreground mb-1">
            {data.entriesCount} transaksi
          </p>
          <p className="text-sm font-medium">
            {formatCurrency(data.totalAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.percentage.toFixed(1)}% dari total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = (chartData: any[], title: string, icon: React.ReactNode, emptyMessage: string) => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <div className="mb-2">{icon}</div>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    const total = chartData.reduce((sum, item) => sum + item.totalAmount, 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <Badge variant="outline">
            {formatCurrency(total)}
          </Badge>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ accountName, percentage }) => 
                  percentage > 5 ? `${accountName} (${percentage.toFixed(1)}%)` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalAmount"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with details */}
        <div className="space-y-2">
          {chartData.map((item, index) => (
            <div key={item.accountId} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{item.accountName}</span>
                <Badge variant="secondary" className="text-xs">
                  {item.entriesCount}
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(item.totalAmount)}</div>
                <div className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Komposisi Keuangan</CardTitle>
        <CardDescription>
          Breakdown pemasukan dan pengeluaran berdasarkan kategori akun
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Pemasukan</span>
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4" />
              <span>Pengeluaran</span>
            </TabsTrigger>
            <TabsTrigger value="other" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Lainnya</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="mt-6">
            {renderChart(
              data.income,
              "Pemasukan",
              <TrendingUp className="h-5 w-5 text-green-600" />,
              "Tidak ada data pemasukan untuk periode ini"
            )}
          </TabsContent>
          
          <TabsContent value="expense" className="mt-6">
            {renderChart(
              data.expense,
              "Pengeluaran",
              <TrendingDown className="h-5 w-5 text-red-600" />,
              "Tidak ada data pengeluaran untuk periode ini"
            )}
          </TabsContent>
          
          <TabsContent value="other" className="mt-6">
            {renderChart(
              data.other,
              "Lainnya",
              <DollarSign className="h-5 w-5 text-blue-600" />,
              "Tidak ada data kategori lainnya untuk periode ini"
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function BreakdownChartsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="h-[300px] w-full bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
