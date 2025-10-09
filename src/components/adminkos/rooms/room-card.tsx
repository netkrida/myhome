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
import { 
  MoreVertical, 
  Edit, 
  Eye, 
  MapPin,
  DollarSign
} from "lucide-react";
import type { RoomGridItemDTO } from "@/server/types/adminkos";

interface RoomCardProps {
  room: RoomGridItemDTO;
  onEdit: (room: RoomGridItemDTO) => void;
  onViewBooking: (room: RoomGridItemDTO) => void;
  onClick: (room: RoomGridItemDTO) => void;
}

export function RoomCard({ room, onEdit, onViewBooking, onClick }: RoomCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500 border-emerald-600';
      case 'occupied':
        return 'bg-indigo-500 border-indigo-600';
      case 'unavailable':
        return 'bg-zinc-400 border-zinc-500';
      default:
        return 'bg-gray-400 border-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'occupied':
        return 'Terisi';
      case 'unavailable':
        return 'Tidak Tersedia';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'occupied':
        return 'secondary';
      case 'unavailable':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card 
      className={`relative cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 ${
        getStatusColor(room.status)
      }`}
      onClick={() => onClick(room)}
    >
      {/* Status indicator */}
      <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
        getStatusColor(room.status).replace('border-', 'bg-')
      }`} />

      {/* Actions menu */}
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onEdit(room);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Kamar
            </DropdownMenuItem>
            {room.hasActiveBooking && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onViewBooking(room);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Lihat Booking
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-4 pt-8">
        {/* Room number and type */}
        <div className="text-center mb-3">
          <div className="text-lg font-bold text-gray-900">
            #{room.roomNumber}
          </div>
          <div className="text-sm text-gray-600">
            {room.roomType}
          </div>
        </div>

        {/* Floor */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <MapPin className="h-3 w-3 text-gray-500" />
          <span className="text-xs text-gray-500">
            Lantai {room.floor}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-center gap-1 mb-3">
          <DollarSign className="h-3 w-3 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            {formatPrice(room.monthlyPrice)}/bln
          </span>
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <Badge 
            variant={getStatusBadgeVariant(room.status)}
            className="text-xs"
          >
            {getStatusText(room.status)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
