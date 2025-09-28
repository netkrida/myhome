"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bed,
  DollarSign,
  Home,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from "lucide-react";
import type { RoomSummary, RoomListResponse } from "@/server/types";

interface PropertyRoomsSidebarProps {
  propertyId?: string;
  rooms?: RoomSummary[];
}

interface RoomCardProps {
  room: RoomSummary;
}

function CompactRoomCard({ room }: RoomCardProps) {
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Get first room image from ROOM_PHOTOS category if available
  const roomImage = room.images && room.images.length > 0
    ? room.images.find(img => img.category === 'ROOM_PHOTOS') || room.images[0]
    : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Room Image */}
        {roomImage ? (
          <div className="relative w-full h-24 mb-3 rounded-lg overflow-hidden">
            <Image
              src={roomImage.imageUrl}
              alt={`Kamar ${room.roomNumber}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
        ) : (
          <div className="w-full h-24 mb-3 rounded-lg bg-muted flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Room Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Kamar {room.roomNumber}</span>
            </div>
            <Badge variant={room.isAvailable ? "default" : "secondary"} className="text-xs">
              {room.isAvailable ? "Tersedia" : "Terisi"}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            <div>Lantai {room.floor} • {room.roomType}</div>
            {room.size && <div>Ukuran: {room.size} m²</div>}
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {formatPrice(room.monthlyPrice)}
            </div>
            <div className="text-xs text-muted-foreground">per bulan</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PropertyRoomsSidebar({ propertyId, rooms: initialRooms }: PropertyRoomsSidebarProps) {
  const [rooms, setRooms] = useState<RoomSummary[]>(initialRooms || []);
  const [loading, setLoading] = useState(!initialRooms);
  const [error, setError] = useState<string | null>(null);

  // Fetch rooms data if not provided and propertyId is available
  useEffect(() => {
    if (!initialRooms && propertyId) {
      const fetchRooms = async () => {
        try {
          setLoading(true);
          setError(null);

          console.log("🏠 Fetching rooms for property:", propertyId);

          const response = await fetch(`/api/properties/${propertyId}/rooms`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch rooms");
          }

          const result: { success: boolean; data: RoomListResponse } = await response.json();

          if (result.success && result.data) {
            console.log("🏠 Rooms fetched successfully:", result.data);
            setRooms(result.data.rooms.map(room => ({
              id: room.id,
              roomNumber: room.roomNumber,
              floor: room.floor,
              roomType: room.roomType,
              description: room.description,
              size: room.size,
              monthlyPrice: room.monthlyPrice,
              dailyPrice: room.dailyPrice,
              weeklyPrice: room.weeklyPrice,
              quarterlyPrice: room.quarterlyPrice,
              yearlyPrice: room.yearlyPrice,
              hasDeposit: !!room.depositPercentage,
              depositPercentage: room.depositPercentage,
              facilities: room.facilities || [],
              isAvailable: room.isAvailable,
              createdAt: room.createdAt,
              updatedAt: room.createdAt, // Use createdAt as fallback for updatedAt
              images: [] // Empty array as default since RoomListItem doesn't include images
            })));
          } else {
            throw new Error("Invalid response format");
          }
        } catch (error) {
          console.error("Error fetching rooms:", error);
          setError(error instanceof Error ? error.message : "Failed to fetch rooms");
        } finally {
          setLoading(false);
        }
      };

      fetchRooms();
    } else if (initialRooms) {
      setLoading(false);
    }
  }, [propertyId, initialRooms]);

  const roomsData = rooms;
  const totalRooms = roomsData.length;
  const availableRooms = roomsData.filter(room => room.isAvailable).length;
  const occupiedRooms = totalRooms - availableRooms;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Kamar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Kamar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-2 text-sm">Gagal memuat data kamar</div>
            <div className="text-xs text-muted-foreground">{error}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalRooms === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Kamar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Bed className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="font-medium mb-1">Belum Ada Kamar</h4>
            <p className="text-xs text-muted-foreground text-center">
              Properti ini belum memiliki data kamar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daftar Kamar ({totalRooms})</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-green-600 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            {availableRooms} Tersedia
          </Badge>
          <Badge variant="outline" className="text-blue-600 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            {occupiedRooms} Terisi
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {roomsData.map((room) => (
              <CompactRoomCard key={room.id} room={room} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default PropertyRoomsSidebar;
