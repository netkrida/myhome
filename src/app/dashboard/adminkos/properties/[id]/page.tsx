"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { RoomList, RoomStats } from "@/components/room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Building2, 
  Users, 
  Bed,
  Plus,
  Calendar,
  DollarSign
} from "lucide-react";
import type { PropertyDetailDTO } from "@/server/types";
import { PropertyStatus, PropertyType } from "@/server/types/property";

const statusConfig = {
  [PropertyStatus.PENDING]: {
    label: "Menunggu Persetujuan",
    variant: "secondary" as const,
    color: "text-yellow-600",
  },
  [PropertyStatus.APPROVED]: {
    label: "Disetujui",
    variant: "default" as const,
    color: "text-green-600",
  },
  [PropertyStatus.REJECTED]: {
    label: "Ditolak",
    variant: "destructive" as const,
    color: "text-red-600",
  },
  [PropertyStatus.SUSPENDED]: {
    label: "Disuspend",
    variant: "outline" as const,
    color: "text-orange-600",
  },
};

const typeConfig = {
  [PropertyType.MALE_ONLY]: {
    label: "Kos Putra",
    avatar: "👨",
  },
  [PropertyType.FEMALE_ONLY]: {
    label: "Kos Putri",
    avatar: "👩",
  },
  [PropertyType.MIXED]: {
    label: "Kos Campur",
    avatar: "👥",
  },
};

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<PropertyDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/properties/${propertyId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch property");
        }

        const data: PropertyDetailDTO = await response.json();
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || "Properti tidak ditemukan"}</p>
          <Button asChild className="mt-4">
            <a href="/dashboard/adminkos/properties">
              Kembali ke Daftar Properti
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[property.status];
  const typeInfo = typeConfig[property.propertyType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/adminkos/properties">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </a>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{property.name}</h1>
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{property.location.districtName}, {property.location.regencyName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">{typeInfo.avatar}</span>
                <span>{typeInfo.label}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={`/dashboard/adminkos/properties/${propertyId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Properti
            </a>
          </Button>
          <Button asChild>
            <a href={`/dashboard/adminkos/properties/${propertyId}/rooms/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kamar
            </a>
          </Button>
        </div>
      </div>

      {/* Property Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kamar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.totalRooms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kamar Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{property.availableRooms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tingkat Okupansi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(((property.totalRooms - property.availableRooms) / property.totalRooms) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tahun Bangun
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.buildYear}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Kamar ({property.totalRooms})
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Detail Properti
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Analitik
          </TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-6">
          {/* Room Statistics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Statistik Kamar</h2>
            <RoomStats propertyId={propertyId} />
          </div>

          {/* Room List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Daftar Kamar</h2>
              <Button asChild>
                <a href={`/dashboard/adminkos/properties/${propertyId}/rooms/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kamar
                </a>
              </Button>
            </div>
            <RoomList propertyId={propertyId} />
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nama Properti</label>
                  <p className="font-medium">{property.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                  <p className="text-sm">{property.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Jenis Kos</label>
                  <p className="font-medium">{typeInfo.label}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tahun Bangun</label>
                  <p className="font-medium">{property.buildYear}</p>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Lokasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alamat Lengkap</label>
                  <p className="text-sm">{property.location.fullAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provinsi</label>
                    <p className="font-medium">{property.location.provinceName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kab/Kota</label>
                    <p className="font-medium">{property.location.regencyName}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kecamatan</label>
                  <p className="font-medium">{property.location.districtName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Latitude</label>
                    <p className="font-medium">{property.location.latitude}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Longitude</label>
                    <p className="font-medium">{property.location.longitude}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Facilities */}
            {property.facilities && property.facilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fasilitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.facilities.map((facility, index) => (
                      <Badge key={index} variant="outline">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            {property.rules && property.rules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Peraturan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {property.rules.map((rule, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground">•</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analitik Segera Hadir</h3>
            <p className="text-muted-foreground">
              Fitur analitik dan laporan akan tersedia dalam update mendatang
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
