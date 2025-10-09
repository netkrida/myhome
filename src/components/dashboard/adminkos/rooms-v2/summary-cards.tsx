"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DoorOpen, Users, TrendingUp } from "lucide-react";

interface SummaryCardsProps {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  propertyName?: string;
  isLoading?: boolean;
}

export function SummaryCards({
  totalRooms,
  availableRooms,
  occupiedRooms,
  occupancyRate,
  propertyName,
  isLoading = false,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Kamar",
      value: totalRooms,
      icon: Building2,
      description: propertyName || "Semua properti",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Kamar Tersedia",
      value: availableRooms,
      icon: DoorOpen,
      description: "Siap dihuni",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Kamar Terisi",
      value: occupiedRooms,
      icon: Users,
      description: "Sedang ditempati",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      description: "Tingkat hunian",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className="rounded-2xl border-border/50 hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {card.title}
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight mb-1">
                    {card.value}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

