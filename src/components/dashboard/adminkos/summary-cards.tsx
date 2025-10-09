"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  Bed, 
  BedDouble, 
  Percent, 
  Calendar, 
  Wallet, 
  Coins, 
  Clock 
} from "lucide-react";
import type { AdminKosSummaryDTO } from "@/server/types/adminkos";

interface SummaryCardsProps {
  data: AdminKosSummaryDTO;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Properti Aktif",
      value: data.totalActiveProperties,
      icon: Home,
      description: "Properti disetujui",
    },
    {
      title: "Total Kamar",
      value: data.totalRooms,
      icon: Bed,
      description: "Semua kamar",
    },
    {
      title: "Kamar Tersedia",
      value: data.availableRooms,
      icon: BedDouble,
      description: "Siap dihuni",
    },
    {
      title: "Tingkat Hunian",
      value: `${data.occupancyRate}%`,
      icon: Percent,
      description: "Occupancy rate",
    },
    {
      title: "Booking Aktif",
      value: data.activeBookings,
      icon: Calendar,
      description: "Booking berjalan",
    },
    {
      title: "Pendapatan Bulan Ini",
      value: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(data.revenueThisMonth),
      icon: Wallet,
      description: "Total pendapatan",
    },
    {
      title: "Deposit Diterima",
      value: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(data.depositReceivedThisMonth),
      icon: Coins,
      description: "Bulan ini",
    },
    {
      title: "Tagihan Tertunda",
      value: data.pendingPayments,
      icon: Clock,
      description: "Menunggu pembayaran",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

