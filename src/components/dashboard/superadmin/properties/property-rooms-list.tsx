"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Bed,
  DollarSign,
  Home,
  CheckCircle,
  XCircle,
  Ruler,
  Calendar,
  Percent,
  Image as ImageIcon
} from "lucide-react";
import type { RoomSummary, RoomListResponse } from "@/server/types";

interface PropertyRoomsListProps {
  propertyId: string;
  rooms?: RoomSummary[]; // Make optional since we'll fetch data
}

interface RoomCardProps {
  room: RoomSummary;
}

function RoomCard({ room }: RoomCardProps) {
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Kamar {room.roomNumber}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={room.isAvailable ? "default" : "secondary"}>
                {room.isAvailable ? "Tersedia" : "Terisi"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Lantai {room.floor}
              </span>
              <span className="text-sm text-muted-foreground">
                {room.roomType}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(room.monthlyPrice)}
            </div>
            <div className="text-sm text-muted-foreground">per bulan</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Room Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Status:</span> {room.isAvailable ? "Tersedia" : "Terisi"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Harga:</span> {formatPrice(room.monthlyPrice)}/bulan
            </span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="text-sm text-muted-foreground">
          <p>Kamar {room.roomType} di lantai {room.floor}</p>
          <p className="mt-1">
            {room.isAvailable ? "Kamar ini tersedia untuk disewa" : "Kamar ini sedang terisi"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PropertyRoomsList({ propertyId, rooms: initialRooms }: PropertyRoomsListProps) {
  const [rooms, setRooms] = useState<RoomSummary[]>(initialRooms || []);
  const [loading, setLoading] = useState(!initialRooms);
  const [error, setError] = useState<string | null>(null);

  // Fetch rooms data if not provided
  useEffect(() => {
    if (!initialRooms) {
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
    }
  }, [propertyId, initialRooms]);

  const roomsData = rooms;
  const totalRooms = roomsData.length;
  const availableRooms = roomsData.filter(room => room.isAvailable).length;
  const occupiedRooms = totalRooms - availableRooms;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Gagal memuat data kamar</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (totalRooms === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bed className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Kamar</h3>
          <p className="text-muted-foreground text-center">
            Properti ini belum memiliki data kamar yang terdaftar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Room Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Kamar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalRooms}</div>
              <div className="text-sm text-muted-foreground">Total Kamar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{availableRooms}</div>
              <div className="text-sm text-muted-foreground">Kamar Tersedia</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{occupiedRooms}</div>
              <div className="text-sm text-muted-foreground">Kamar Terisi</div>
            </div>
          </div>
          
          {totalRooms > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Tingkat Hunian</span>
                <span>{Math.round((occupiedRooms / totalRooms) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(occupiedRooms / totalRooms) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rooms List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Daftar Kamar ({totalRooms})</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              {availableRooms} Tersedia
            </Badge>
            <Badge variant="outline" className="text-blue-600">
              <XCircle className="h-3 w-3 mr-1" />
              {occupiedRooms} Terisi
            </Badge>
          </div>
        </div>

        {roomsData.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

export default PropertyRoomsList;
