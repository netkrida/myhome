"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bed,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Ruler
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomListItem } from "@/server/types";

interface RoomCardProps {
  room: RoomListItem;
  onEdit?: (room: RoomListItem) => void;
  onDelete?: (room: RoomListItem) => void;
  onToggleAvailability?: (room: RoomListItem) => void;
  showActions?: boolean;
  showProperty?: boolean;
  className?: string;
}

export function RoomCard({
  room,
  onEdit,
  onDelete,
  onToggleAvailability,
  showActions = true,
  showProperty = false,
  className,
}: RoomCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get main price (monthly if available, otherwise daily)
  const getMainPrice = () => {
    if (room.monthlyPrice) {
      return { price: room.monthlyPrice, period: "bulan" };
    }
    if (room.dailyPrice) {
      return { price: room.dailyPrice, period: "hari" };
    }
    if (room.weeklyPrice) {
      return { price: room.weeklyPrice, period: "minggu" };
    }
    return null;
  };

  const mainPrice = getMainPrice();

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}>
      {/* Room Image */}
      <div className="relative h-48 bg-muted">
        {room.mainImage && !imageError ? (
          <Image
            src={room.mainImage}
            alt={`${room.roomType} ${room.roomNumber}`}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Bed className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Availability Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={room.isAvailable ? "default" : "secondary"} className="flex items-center gap-1">
            {room.isAvailable ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Tersedia
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Terisi
              </>
            )}
          </Badge>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  Lihat Detail
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(room)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onToggleAvailability && (
                  <DropdownMenuItem onClick={() => onToggleAvailability(room)}>
                    {room.isAvailable ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Tandai Terisi
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Tandai Tersedia
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(room)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg leading-tight">
              {room.roomType} {room.roomNumber}
            </h3>
            {mainPrice && (
              <div className="text-right">
                <div className="font-bold text-lg text-primary">
                  {formatPrice(mainPrice.price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  per {mainPrice.period}
                </div>
              </div>
            )}
          </div>
          
          {/* Property Info */}
          {showProperty && room.property && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Properti:</span> {room.property.name}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Room Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {room.floor && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Lantai:</span>
              <span className="font-medium">{room.floor}</span>
            </div>
          )}
          {room.size && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span>{room.size}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Facilities Preview */}
        {room.facilities && room.facilities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Fasilitas:</div>
            <div className="flex flex-wrap gap-1">
              {room.facilities.slice(0, 3).map((facility, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {facility.name}
                </Badge>
              ))}
              {room.facilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{room.facilities.length - 3} lainnya
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        {(room.dailyPrice || room.weeklyPrice || room.monthlyPrice) && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium mb-1">Harga:</div>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {room.dailyPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harian:</span>
                  <span className="font-medium">{formatPrice(room.dailyPrice)}</span>
                </div>
              )}
              {room.weeklyPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mingguan:</span>
                  <span className="font-medium">{formatPrice(room.weeklyPrice)}</span>
                </div>
              )}
              {room.monthlyPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bulanan:</span>
                  <span className="font-medium">{formatPrice(room.monthlyPrice)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>
            Dibuat {new Date(room.createdAt).toLocaleDateString('id-ID')}
          </span>
          <div className="flex items-center gap-2">
            {room.depositPercentage && (
              <span>Deposit: {room.depositPercentage}%</span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
