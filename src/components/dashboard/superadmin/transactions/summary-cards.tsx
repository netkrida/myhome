"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  Clock,
  XCircle,
  RotateCcw,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  data: {
    totalTransactions: number;
    totalRevenue: number;
    pendingCount: number;
    pendingAmount: number;
    failedCount: number;
    failedAmount: number;
    refundedAmount: number;
    averageOrderValue: number;
  } | null;
  isLoading: boolean;
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      title: "Total Transaksi",
      value: data.totalTransactions.toLocaleString("id-ID"),
      subtitle: "Semua transaksi",
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Total Omzet",
      value: formatCurrency(data.totalRevenue),
      subtitle: "Transaksi sukses",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-950",
    },
    {
      title: "Pending",
      value: data.pendingCount.toLocaleString("id-ID"),
      subtitle: formatCurrency(data.pendingAmount),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-950",
    },
    {
      title: "Failed/Expired",
      value: data.failedCount.toLocaleString("id-ID"),
      subtitle: formatCurrency(data.failedAmount),
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-100 dark:bg-rose-950",
    },
    {
      title: "Refunded",
      value: formatCurrency(data.refundedAmount),
      subtitle: "Total dikembalikan",
      icon: RotateCcw,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-950",
    },
    {
      title: "AOV",
      value: formatCurrency(data.averageOrderValue),
      subtitle: "Rata-rata per transaksi",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

