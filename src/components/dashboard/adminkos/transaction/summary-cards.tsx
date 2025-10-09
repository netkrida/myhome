"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  DollarSign,
  PiggyBank
} from "lucide-react";
import type { LedgerSummaryDTO } from "@/server/types/ledger";

interface SummaryCardsProps {
  data: LedgerSummaryDTO;
  isLoading?: boolean;
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return <SummaryCardsSkeleton />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPeriod = (dateFrom: Date, dateTo: Date) => {
    const from = new Date(dateFrom).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    const to = new Date(dateTo).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${from} - ${to}`;
  };

  const cards = [
    {
      title: "Uang Masuk",
      value: data.cashInPeriod,
      icon: TrendingUp,
      description: `Periode ${formatPeriod(data.dateFrom, data.dateTo)}`,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Uang Keluar",
      value: data.cashOutPeriod,
      icon: TrendingDown,
      description: `Periode ${formatPeriod(data.dateFrom, data.dateTo)}`,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Saldo",
      value: data.totalBalance,
      icon: Wallet,
      description: "Saldo keseluruhan hingga hari ini",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Saldo Tersedia",
      value: data.availableBalance,
      icon: DollarSign,
      description: "Saldo yang dapat ditarik",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Pembayaran Kos",
      value: data.paymentIncomeThisMonth,
      icon: CreditCard,
      description: `Pemasukan dari pembayaran periode ini`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Penarikan",
      value: data.totalWithdrawals,
      icon: PiggyBank,
      description: "Total dana yang telah ditarik",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.value >= 0;
        const displayValue = Math.abs(card.value);

        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">
                  {formatCurrency(displayValue)}
                </div>
                {card.title.includes("Saldo") && !isPositive && (
                  <Badge variant="destructive" className="text-xs">
                    Minus
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              
              {/* Net cash flow indicator for period cards */}
              {(card.title === "Uang Masuk" || card.title === "Uang Keluar") && (
                <div className="mt-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-muted-foreground">
                      Net Flow:
                    </span>
                    <span className={`text-xs font-medium ${
                      data.netCashFlowPeriod >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(data.netCashFlowPeriod)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-muted rounded mb-2" />
            <div className="h-3 w-40 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
