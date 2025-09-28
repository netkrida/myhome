"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bed, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp,
  Users,
  Home,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomStatsDTO } from "@/server/types";

interface RoomStatsProps {
  propertyId?: string;
  className?: string;
}

export function RoomStats({ propertyId, className }: RoomStatsProps) {
  const [stats, setStats] = useState<RoomStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (propertyId) params.set("propertyId", propertyId);

        const response = await fetch(`/api/rooms/stats?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch room statistics");
        }

        const data: RoomStatsDTO = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [propertyId]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {error || "Gagal memuat statistik"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsCards = [
    {
      title: "Total Kamar",
      value: stats.totalRooms,
      icon: Bed,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Kamar Tersedia",
      value: stats.availableRooms,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      description: `${((stats.availableRooms / stats.totalRooms) * 100).toFixed(1)}% dari total`,
    },
    {
      title: "Kamar Terisi",
      value: stats.occupiedRooms,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      description: `${((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)}% dari total`,
    },
    {
      title: "Tingkat Okupansi",
      value: `${stats.occupancyRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      description: `${stats.occupiedRooms} dari ${stats.totalRooms} kamar`,
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", card.bgColor)}>
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof card.value === 'number' ? card.value.toLocaleString('id-ID') : card.value}
              </div>
              {card.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
