"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bed,
  Plus,
  CheckCircle,
  XCircle,
  DoorOpen,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RoomType {
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  lowestPrice: number;
  highestPrice: number;
  mainImage: string | null;
}

interface RoomTypesSummary {
  totalRoomTypes: number;
  totalRooms: number;
  roomTypes: RoomType[];
}

interface PropertyRoomTypesProps {
  propertyId: string;
}

function RoomTypeCard({ roomType }: { roomType: RoomType }) {
  const occupancyRate = roomType.totalRooms > 0 
    ? Math.round((roomType.occupiedRooms / roomType.totalRooms) * 100) 
    : 0;

  const priceDisplay = roomType.lowestPrice === roomType.highestPrice
    ? formatCurrency(roomType.lowestPrice)
    : `${formatCurrency(roomType.lowestPrice)} - ${formatCurrency(roomType.highestPrice)}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
          {roomType.mainImage ? (
            <img
              src={roomType.mainImage}
              alt={roomType.roomType}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <DoorOpen className="h-16 w-16 text-slate-400 dark:text-slate-600" />
            </div>
          )}
          {/* Availability Badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={roomType.availableRooms > 0 ? "default" : "secondary"}
              className="shadow-md"
            >
              {roomType.availableRooms > 0 ? "Tersedia" : "Penuh"}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title & Price */}
          <div>
            <h3 className="font-semibold text-lg mb-1">{roomType.roomType}</h3>
            <p className="text-sm text-primary font-semibold">{priceDisplay}</p>
            <p className="text-xs text-muted-foreground">per bulan</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{roomType.totalRooms}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Tersedia</p>
              <p className="text-lg font-bold text-green-600">{roomType.availableRooms}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Terisi</p>
              <p className="text-lg font-bold text-blue-600">{roomType.occupiedRooms}</p>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Tingkat Hunian</span>
              <span className="font-medium">{occupancyRate}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PropertyRoomTypes({ propertyId }: PropertyRoomTypesProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<RoomTypesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/adminkos/properties/${propertyId}/room-types-summary`);
        const result = await response.json();

        if (result.success && result.data) {
          setSummary(result.data);
        } else {
          setError(result.error || "Failed to load room types");
        }
      } catch (err) {
        console.error("Error fetching room types:", err);
        setError("Failed to load room types");
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchRoomTypes();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const totalAvailable = summary.roomTypes.reduce((sum, rt) => sum + rt.availableRooms, 0);
  const totalOccupied = summary.roomTypes.reduce((sum, rt) => sum + rt.occupiedRooms, 0);
  const overallOccupancyRate = summary.totalRooms > 0 
    ? Math.round((totalOccupied / summary.totalRooms) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Ringkasan Jenis Kamar
            </CardTitle>
            <Button 
              onClick={() => router.push(`/dashboard/adminkos/properties/${propertyId}/add-room-type`)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Jenis Kamar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Total Jenis Kamar</p>
              <p className="text-3xl font-bold">{summary.totalRoomTypes}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Total Kamar</p>
              <p className="text-3xl font-bold">{summary.totalRooms}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <p className="text-sm text-muted-foreground mb-1">Kamar Tersedia</p>
              <p className="text-3xl font-bold text-green-600">{totalAvailable}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10">
              <p className="text-sm text-muted-foreground mb-1">Tingkat Hunian</p>
              <p className="text-3xl font-bold text-blue-600">{overallOccupancyRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Types List */}
      {summary.roomTypes.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Daftar Jenis Kamar ({summary.totalRoomTypes})
            </h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                {totalAvailable} Tersedia
              </Badge>
              <Badge variant="outline" className="text-blue-600">
                <XCircle className="h-3 w-3 mr-1" />
                {totalOccupied} Terisi
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.roomTypes.map((roomType, index) => (
              <RoomTypeCard key={index} roomType={roomType} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bed className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Jenis Kamar</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Tambahkan jenis kamar pertama untuk properti ini
            </p>
            <Button 
              onClick={() => router.push(`/dashboard/adminkos/properties/${propertyId}/add-room-type`)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Jenis Kamar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

