"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PropertyImageGallery, PropertyRoomsSidebar } from "@/components/dashboard/superadmin/properties";
import { PropertyApprovalDialog } from "@/components/dashboard/superadmin/properties/property-approval-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  User,
  Calendar,
  Eye,
  Home
} from "lucide-react";
import type { PropertyDetailItem } from "@/server/types";
import { PropertyStatus, PROPERTY_FACILITIES, PROPERTY_RULES } from "@/server/types/property";

export default function SuperadminPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;



  const [property, setProperty] = useState<PropertyDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Fetching property detail for ID:", propertyId);

        // Special handling for test-id
        if (propertyId === "test-id") {
          console.log("🧪 Using test data for test-id");
          setProperty({
            id: "test-id",
            name: "Test Property",
            buildYear: 2020,
            propertyType: "KOS" as any,
            description: "This is a test property for navigation testing",
            roomTypes: ["Single", "Double"],
            totalRooms: 10,
            availableRooms: 5,
            location: {
              provinceCode: "32",
              provinceName: "Jawa Barat",
              regencyCode: "3273",
              regencyName: "Bandung",
              districtCode: "327301",
              districtName: "Coblong",
              fullAddress: "Jl. Test No. 123, Coblong, Bandung",
              latitude: -6.8915,
              longitude: 107.6107,
            },
            facilities: [],
            rules: [],
            status: "PENDING" as any,
            ownerId: "test-owner",
            createdAt: new Date(),
            updatedAt: new Date(),
            approvedAt: undefined,
            approvedBy: undefined,
            images: [],
            owner: {
              id: "test-owner",
              name: "Test Owner",
              email: "test@example.com",
              phoneNumber: "08123456789"
            },
            approver: undefined,
            rooms: []
          });
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/properties/${propertyId}`);

        console.log("🔍 API Response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("🔍 API Error:", errorData);
          throw new Error(errorData.error || "Failed to fetch property");
        }

        const result = await response.json();
        console.log("🔍 API Result:", result);
        setProperty(result.data);
      } catch (error) {
        console.error("Error fetching property:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch property");
        toast.error("Gagal memuat detail properti");
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const handleApprovalSuccess = () => {
    // Refresh property data
    if (propertyId) {
      const fetchProperty = async () => {
        try {
          const response = await fetch(`/api/properties/${propertyId}`);
          if (response.ok) {
            const result = await response.json();
            setProperty(result.data);
          }
        } catch (error) {
          console.error("Error refreshing property:", error);
        }
      };
      fetchProperty();
    }
  };

  const getStatusBadge = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.PENDING:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Menunggu Review
          </Badge>
        );
      case PropertyStatus.APPROVED:
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Disetujui
          </Badge>
        );
      case PropertyStatus.REJECTED:
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Ditolak
          </Badge>
        );
      case PropertyStatus.SUSPENDED:
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Disuspend
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canApprove = property && property.status === PropertyStatus.PENDING;

  if (loading) {
    return (
      <DashboardLayout title="Detail Properti">
        <div className="container mx-auto px-4 lg:px-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout title="Detail Properti">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Properti Tidak Ditemukan</h3>
              <p className="text-muted-foreground text-center mb-4">
                {error || "Properti yang Anda cari tidak ditemukan atau telah dihapus."}
              </p>
              <div className="text-sm text-muted-foreground mb-4">
                Property ID: {propertyId}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/dashboard/superadmin/properties")}>
                  Kembali ke Daftar Properti
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/debug/properties/${propertyId}`);
                      const data = await response.json();
                      console.log("🔍 Debug property detail:", data);
                      alert("Debug info logged to console. Check browser console for details.");
                    } catch (err) {
                      console.error("Debug error:", err);
                      alert("Debug failed. Check console for details.");
                    }
                  }}
                >
                  Debug Property
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Detail Properti - ${property.name}`}>
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{property.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {property.location.districtName}, {property.location.regencyName}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {property.owner?.name || property.owner?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(property.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(property.status)}
            {canApprove && (
              <Button
                onClick={() => setApprovalDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Review Properti
              </Button>
            )}
          </div>
        </div>

        {/* Property Detail Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <PropertyImageGallery
              images={{
                building: property.images?.filter(img => img.category === 'BUILDING_PHOTOS') || [],
                shared: property.images?.filter(img => img.category === 'SHARED_FACILITIES_PHOTOS') || [],
                floorPlan: property.images?.filter(img => img.category === 'FLOOR_PLAN_PHOTOS') || []
              }}
            />

            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{property.name}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.location.fullAddress}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-3">Deskripsi</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {/* Property Details */}
                <div>
                  <h3 className="font-semibold mb-3">Detail Properti</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium">{property.propertyType}</div>
                      <div className="text-xs text-muted-foreground">Tipe</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium">{property.buildYear}</div>
                      <div className="text-xs text-muted-foreground">Tahun Bangun</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Home className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium">{property.totalRooms}</div>
                      <div className="text-xs text-muted-foreground">Total Kamar</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <div className="text-sm font-medium">{property.availableRooms}</div>
                      <div className="text-xs text-muted-foreground">Tersedia</div>
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <h3 className="font-semibold mb-4">Fasilitas Properti</h3>

                  {/* Active Property Facilities */}
                  {(() => {
                    const activePropertyFacilities = PROPERTY_FACILITIES.property.filter(facility =>
                      property.facilities?.some((f: any) => f.id === facility.id)
                    );

                    if (activePropertyFacilities.length > 0) {
                      return (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Fasilitas Umum</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activePropertyFacilities.map((facility) => (
                              <div key={facility.id} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                                <span>{facility.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Active Parking Facilities */}
                  {(() => {
                    const activeParkingFacilities = PROPERTY_FACILITIES.parking.filter(facility =>
                      property.facilities?.some((f: any) => f.id === facility.id)
                    );

                    if (activeParkingFacilities.length > 0) {
                      return (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Fasilitas Parkir</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeParkingFacilities.map((facility) => (
                              <div key={facility.id} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                                <span>{facility.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* No Facilities Message */}
                  {(!property.facilities || property.facilities.length === 0) && (
                    <div className="text-sm text-muted-foreground italic">
                      Belum ada fasilitas yang ditambahkan untuk properti ini.
                    </div>
                  )}
                </div>

                {/* Rules */}
                <div>
                  <h3 className="font-semibold mb-4">Peraturan Khusus</h3>

                  {/* Active Rules */}
                  {(() => {
                    const activeRules = PROPERTY_RULES.filter(rule =>
                      property.rules?.some((r: any) => r.id === rule.id)
                    );

                    if (activeRules.length > 0) {
                      return (
                        <div className="grid grid-cols-1 gap-2">
                          {activeRules.map((rule) => (
                            <div key={rule.id} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-orange-500" />
                              <span>{rule.name}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="text-sm text-muted-foreground italic">
                        Belum ada peraturan khusus yang ditetapkan untuk properti ini.
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Property Status & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Properti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(property.status)}
                </div>

                {canApprove && (
                  <Button
                    onClick={() => setApprovalDialogOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Properti
                  </Button>
                )}

                {property.approvedAt && property.approver && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Disetujui oleh: {property.approver.name || property.approver.email}</div>
                    <div>Tanggal: {new Date(property.approvedAt).toLocaleDateString("id-ID")}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pemilik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{property.owner?.name || "Tidak ada nama"}</div>
                    <div className="text-sm text-muted-foreground">{property.owner?.email}</div>
                  </div>
                </div>
                {property.owner?.phoneNumber && (
                  <div className="text-sm">
                    <span className="font-medium">Telepon: </span>
                    {property.owner.phoneNumber}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Kamar:</span>
                  <span className="font-medium">{property.totalRooms}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kamar Tersedia:</span>
                  <span className="font-medium text-green-600">{property.availableRooms}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kamar Terisi:</span>
                  <span className="font-medium text-blue-600">{property.totalRooms - property.availableRooms}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tingkat Hunian:</span>
                  <span className="font-medium">
                    {property.totalRooms > 0
                      ? Math.round(((property.totalRooms - property.availableRooms) / property.totalRooms) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Dibuat</div>
                    <div className="text-muted-foreground">
                      {new Date(property.createdAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Terakhir Update</div>
                    <div className="text-muted-foreground">
                      {new Date(property.updatedAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rooms List */}
            <PropertyRoomsSidebar
              propertyId={property.id}
              rooms={property.rooms}
            />
          </div>
        </div>

        {/* Property Approval Dialog */}
        <PropertyApprovalDialog
          property={property}
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          onSuccess={handleApprovalSuccess}
        />
      </div>
    </DashboardLayout>
  );
}