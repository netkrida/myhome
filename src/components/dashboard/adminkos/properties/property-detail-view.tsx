"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PropertyImageGallery } from "@/components/dashboard/superadmin/properties/property-image-gallery";
import { PropertyRoomTypes } from "./property-room-types";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  Home, 
  Wifi, 
  Car, 
  Shield, 
  Info,
  Image as ImageIcon,
  Bed,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { PropertyDetailItem } from "@/server/types";
import { PropertyStatus, PropertyType } from "@/server/types/property";

interface PropertyDetailViewProps {
  property: PropertyDetailItem;
  showEditButton?: boolean;
}

export function PropertyDetailView({ property, showEditButton = false }: PropertyDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  const getPropertyTypeText = (type: PropertyType) => {
    switch (type) {
      case PropertyType.MALE_ONLY:
        return "Khusus Pria";
      case PropertyType.FEMALE_ONLY:
        return "Khusus Wanita";
      case PropertyType.MIXED:
        return "Campur";
      default:
        return type;
    }
  };

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.APPROVED:
        return "text-green-600";
      case PropertyStatus.REJECTED:
        return "text-red-600";
      case PropertyStatus.SUSPENDED:
        return "text-orange-600";
      case PropertyStatus.PENDING:
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case PropertyStatus.REJECTED:
        return <XCircle className="h-4 w-4" />;
      case PropertyStatus.SUSPENDED:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/adminkos/properties/${property.id}/edit`);
  };

  // Group facilities by category
  const facilitiesByCategory = {
    property: property.facilities?.filter((f: any) => f.category === 'property') || [],
    parking: property.facilities?.filter((f: any) => f.category === 'parking') || [],
  };

  // Group images by category
  const imagesByCategory = {
    building: property.images?.filter(img => img.category === 'BUILDING_PHOTOS') || [],
    shared: property.images?.filter(img => img.category === 'SHARED_FACILITIES_PHOTOS') || [],
    floorPlan: property.images?.filter(img => img.category === 'FLOOR_PLAN_PHOTOS') || [],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Side (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Foto</span>
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Bed className="h-4 w-4" />
              <span className="hidden sm:inline">Kamar</span>
            </TabsTrigger>
            <TabsTrigger value="facilities" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">Fasilitas</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nama Properti</label>
                    <p className="text-sm">{property.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipe Properti</label>
                    <p className="text-sm">{getPropertyTypeText(property.propertyType)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tahun Dibangun</label>
                    <p className="text-sm">{property.buildYear}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className={`flex items-center gap-2 text-sm ${getStatusColor(property.status)}`}>
                      {getStatusIcon(property.status)}
                      {property.status}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Kamar</label>
                    <p className="text-2xl font-bold">{property.totalRooms}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kamar Tersedia</label>
                    <p className="text-2xl font-bold text-green-600">{property.availableRooms}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kamar Terisi</label>
                    <p className="text-2xl font-bold text-blue-600">{property.totalRooms - property.availableRooms}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                  <p className="text-sm mt-1 leading-relaxed">{property.description}</p>
                </div>

                {property.roomTypes && property.roomTypes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipe Kamar Tersedia</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {property.roomTypes.map((type, index) => (
                          <Badge key={index} variant="secondary">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Informasi Lokasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provinsi</label>
                    <p className="text-sm">{property.location.provinceName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kabupaten/Kota</label>
                    <p className="text-sm">{property.location.regencyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kecamatan</label>
                    <p className="text-sm">{property.location.districtName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Koordinat</label>
                    <p className="text-sm">{property.location.latitude}, {property.location.longitude}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alamat Lengkap</label>
                  <p className="text-sm mt-1">{property.location.fullAddress}</p>
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            {property.rules && property.rules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Peraturan Properti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {property.rules.map((rule: any, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-1">•</span>
                        <div>
                          <span className="font-medium">{rule.name}</span>
                          {rule.description && (
                            <p className="text-muted-foreground mt-1">{rule.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <PropertyImageGallery images={imagesByCategory} />
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <PropertyRoomTypes propertyId={property.id} />
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            {facilitiesByCategory.property.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Fasilitas Properti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {facilitiesByCategory.property.map((facility: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {facility.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {facilitiesByCategory.parking.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Fasilitas Parkir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {facilitiesByCategory.parking.map((facility: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {facility.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {facilitiesByCategory.property.length === 0 && facilitiesByCategory.parking.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Fasilitas</h3>
                  <p className="text-muted-foreground text-center">
                    Properti ini belum memiliki informasi fasilitas.
                  </p>
                  {showEditButton && (
                    <Button onClick={handleEdit} className="mt-4" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Tambah Fasilitas
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar - Right Side (1/3) */}
      <div className="space-y-6">
        {/* Management Actions */}
        {showEditButton && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Kelola Properti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleEdit} className="w-full flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Properti
              </Button>
              
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => window.open(`/property/${property.id}`, '_blank')}
              >
                <Building2 className="h-4 w-4" />
                Lihat Halaman Publik
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informasi Pemilik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama</label>
              <p className="text-sm">{property.owner?.name || "Tidak tersedia"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{property.owner?.email || "Tidak tersedia"}</p>
            </div>
            {property.owner?.phoneNumber && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                <p className="text-sm">{property.owner.phoneNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
              <p className="text-sm">{new Date(property.createdAt).toLocaleDateString("id-ID", {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</label>
              <p className="text-sm">{new Date(property.updatedAt).toLocaleDateString("id-ID", {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            {property.approvedAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Disetujui</label>
                <p className="text-sm">{new Date(property.approvedAt).toLocaleDateString("id-ID", {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            )}
            {property.approver && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Disetujui oleh</label>
                <p className="text-sm">{property.approver.name || property.approver.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Foto</span>
              <span className="font-medium">{property.images?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Kamar</span>
              <span className="font-medium">{property.rooms?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tingkat Hunian</span>
              <span className="font-medium">
                {property.totalRooms > 0 
                  ? Math.round(((property.totalRooms - property.availableRooms) / property.totalRooms) * 100)
                  : 0
                }%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}