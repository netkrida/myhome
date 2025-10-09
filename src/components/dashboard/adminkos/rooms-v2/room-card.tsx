"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Eye, DoorOpen, Info } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface RoomCardProps {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  status: "available" | "occupied" | "unavailable";
  hasActiveBooking: boolean;
  mainImageUrl: string | null;
  onClick: () => void;
  onEdit: () => void;
  onViewBooking?: () => void;
  onViewDetail?: () => void;
}

export function RoomCard({
  id,
  roomNumber,
  roomType,
  floor,
  monthlyPrice,
  status,
  hasActiveBooking,
  mainImageUrl,
  onClick,
  onEdit,
  onViewBooking,
  onViewDetail,
}: RoomCardProps) {
  const statusConfig = {
    available: {
      label: "Tersedia",
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      ringColor: "ring-emerald-500/20",
      bgGradient: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10",
    },
    occupied: {
      label: "Terisi",
      color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
      ringColor: "ring-indigo-500/20",
      bgGradient: "from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10",
    },
    unavailable: {
      label: "Nonaktif",
      color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20",
      ringColor: "ring-zinc-500/20",
      bgGradient: "from-zinc-50 to-zinc-100/50 dark:from-zinc-950/20 dark:to-zinc-900/10",
    },
  };

  const config = statusConfig[status];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all duration-300",
        "hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border-border/50",
        hasActiveBooking && "ring-2 " + config.ringColor
      )}
      onClick={onClick}
    >
      {/* Background Gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        config.bgGradient
      )} />

      <CardContent className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">#{roomNumber}</h3>
              <Badge variant="outline" className={cn("text-xs", config.color)}>
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{roomType}</p>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewDetail && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetail(); }}>
                  <Info className="h-4 w-4 mr-2" />
                  Lihat Detail
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Kamar
              </DropdownMenuItem>
              {hasActiveBooking && onViewBooking && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewBooking(); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Lihat Booking
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Image or Icon */}
        <div className="mb-3 rounded-xl overflow-hidden bg-muted/50">
          {mainImageUrl ? (
            <img
              src={mainImageUrl}
              alt={`Room ${roomNumber}`}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <DoorOpen className="h-12 w-12 text-slate-400 dark:text-slate-600" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lantai</span>
            <span className="font-medium">{floor}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Harga/Bulan</span>
            <span className="font-semibold text-primary">
              {formatCurrency(monthlyPrice)}
            </span>
          </div>
        </div>

        {/* Active Booking Indicator */}
        {hasActiveBooking && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Ada booking aktif</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

