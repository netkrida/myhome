"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
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
import type { LedgerTimeSeriesDTO } from "@/server/types/ledger";

interface CashFlowChartProps {
  data: LedgerTimeSeriesDTO[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function CashFlowChart({ 
  data, 
  isLoading, 
  title = "Tren Arus Kas",
  description = "Perbandingan uang masuk vs keluar dari waktu ke waktu"
}: CashFlowChartProps) {
  if (isLoading) {
    return <CashFlowChartSkeleton />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  // Calculate summary stats
  const totalCashIn = data.reduce((sum, item) => sum + item.cashIn, 0);
  const totalCashOut = data.reduce((sum, item) => sum + item.cashOut, 0);
  const netFlow = totalCashIn - totalCashOut;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          {payload.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">Net Flow:</span>
                <span className={`font-medium ${
                  (payload[0].payload.cashIn - payload[0].payload.cashOut) >= 0 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {formatCurrency(payload[0].payload.cashIn - payload[0].payload.cashOut)}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={netFlow >= 0 ? "default" : "destructive"}
              className="flex items-center space-x-1"
            >
              {netFlow >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{formatCurrency(Math.abs(netFlow))}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Tidak ada data untuk periode ini</p>
              <p className="text-xs mt-1">Pilih rentang tanggal yang berbeda</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value.toString();
                  }}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cashIn"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Uang Masuk"
                />
                <Line
                  type="monotone"
                  dataKey="cashOut"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Uang Keluar"
                />
                <Line
                  type="monotone"
                  dataKey="netFlow"
                  stroke="#6366f1"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Net Flow"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Masuk</p>
            <p className="text-sm font-medium text-green-600">
              {formatCurrency(totalCashIn)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Keluar</p>
            <p className="text-sm font-medium text-red-600">
              {formatCurrency(totalCashOut)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Net Flow</p>
            <p className={`text-sm font-medium ${
              netFlow >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatCurrency(netFlow)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CashFlowChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-3 w-16 bg-muted rounded animate-pulse mx-auto" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
