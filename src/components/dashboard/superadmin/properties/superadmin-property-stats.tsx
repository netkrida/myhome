"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyStatsDTO } from "@/server/types";

interface SuperadminPropertyStatsProps {
  className?: string;
}

export function SuperadminPropertyStats({ className }: SuperadminPropertyStatsProps) {
  const [stats, setStats] = useState<PropertyStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/properties/stats");
        
        if (!response.ok) {
          throw new Error("Failed to fetch property statistics");
        }

        const data: PropertyStatsDTO = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
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

  // Only show property-level statistics for SuperAdmin monitoring
  const statsCards = [
    {
      title: "Total Properti",
      value: stats.totalProperties,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      description: "Properti terdaftar di platform",
    },
    {
      title: "Menunggu Persetujuan",
      value: stats.pendingProperties,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      description: "Perlu direview",
    },
    {
      title: "Disetujui",
      value: stats.approvedProperties,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      description: "Properti aktif",
    },
    {
      title: "Ditolak",
      value: stats.rejectedProperties,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      description: "Tidak memenuhi kriteria",
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
