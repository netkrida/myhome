"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Bed
} from "lucide-react";
import type { RoomsSummaryDTO } from "@/server/types/adminkos";

interface SummaryCardsProps {
  data?: RoomsSummaryDTO;
  isLoading?: boolean;
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-24">
            <p className="text-sm text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Kamar",
      value: data.totalRooms.toLocaleString(),
      description: data.propertyName ? `di ${data.propertyName}` : "semua properti",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Kamar Tersedia",
      value: data.availableRooms.toLocaleString(),
      description: `${data.totalRooms > 0 ? Math.round((data.availableRooms / data.totalRooms) * 100) : 0}% dari total`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Kamar Terisi",
      value: data.occupiedRooms.toLocaleString(),
      description: `${data.totalRooms > 0 ? Math.round((data.occupiedRooms / data.totalRooms) * 100) : 0}% dari total`,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Occupancy Rate",
      value: `${data.occupancyRate}%`,
      description: data.occupancyRate >= 80 ? "Tinggi" : data.occupancyRate >= 60 ? "Sedang" : "Rendah",
      icon: TrendingUp,
      color: data.occupancyRate >= 80 ? "text-emerald-600" : data.occupancyRate >= 60 ? "text-yellow-600" : "text-red-600",
      bgColor: data.occupancyRate >= 80 ? "bg-emerald-50" : data.occupancyRate >= 60 ? "bg-yellow-50" : "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-full ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </div>
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
