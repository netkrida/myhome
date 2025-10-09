"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Users, Building, Calendar } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoomDetailSkeleton } from "./room-detail-skeleton";
import { RoomMapping } from "./room-mapping";
import { RoomTypeInfo } from "./room-type-info";
import type { PropertyRoomTypesResponse } from "@/server/types/room";

interface RoomDetailContentProps {
  propertyId: string;
  roomType?: string;
  includeOccupied?: boolean;
}

function resolveBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  return envBase.startsWith("http") ? envBase : `https://${envBase}`;
}

export function RoomDetailContent({ propertyId, roomType, includeOccupied = true }: RoomDetailContentProps) {
  const [data, setData] = useState<PropertyRoomTypesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = resolveBaseUrl();
        const params = new URLSearchParams();
        
        if (roomType) {
          params.append('roomType', roomType);
        }
        if (includeOccupied) {
          params.append('includeOccupied', 'true');
        }

        const url = `${baseUrl}/api/public/properties/${propertyId}/room-types${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch room data');
        }

        setData(result.data);
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [propertyId, roomType, includeOccupied]);

  if (loading) {
    return <RoomDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground mb-2">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { property, roomTypes, summary } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/property/${propertyId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Detail Properti
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Detail Kamar - {property.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{property.fullAddress}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
            <Badge variant="outline" className="gap-1">
              <Building className="h-3 w-3" />
              {property.propertyType === 'MALE_ONLY' ? 'Khusus Pria' : 
               property.propertyType === 'FEMALE_ONLY' ? 'Khusus Wanita' : 'Campur'}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {summary.totalRooms} Kamar Total
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {summary.totalAvailable} Tersedia
            </Badge>
          </div>
        </div>
      </div>

      {/* Property Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Properti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{summary.totalRoomTypes}</div>
              <div className="text-sm text-muted-foreground">Tipe Kamar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{summary.totalRooms}</div>
              <div className="text-sm text-muted-foreground">Total Kamar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.totalAvailable}</div>
              <div className="text-sm text-muted-foreground">Tersedia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.totalOccupied}</div>
              <div className="text-sm text-muted-foreground">Terisi</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Types */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          {roomType ? `Detail ${roomType}` : 'Semua Tipe Kamar'}
        </h2>
        
        {roomTypes.map((roomTypeData) => (
          <div key={roomTypeData.roomType} className="space-y-4">
            <RoomTypeInfo roomType={roomTypeData} />
            <RoomMapping
              roomType={roomTypeData}
              propertyName={property.name}
              propertyId={property.id}
            />
          </div>
        ))}
      </div>

      {roomTypes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tidak Ada Kamar Ditemukan
            </h3>
            <p className="text-muted-foreground mb-4">
              {roomType 
                ? `Tidak ada kamar dengan tipe "${roomType}" yang ditemukan.`
                : 'Tidak ada kamar yang tersedia saat ini.'
              }
            </p>
            <Button asChild>
              <Link href={`/property/${propertyId}`}>
                Lihat Semua Kamar
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

