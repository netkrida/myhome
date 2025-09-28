"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PropertyList, SuperadminPropertyStats, PropertyApprovalDialog } from "@/components/dashboard/superadmin/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Map
} from "lucide-react";
import type { PropertyListItem, PropertyCoordinate } from "@/server/types";
import { PropertyStatus } from "@/server/types/property";

// Import the map component directly for now
import PropertyMapView from "@/components/maps/property-map-view";

export default function SuperadminPropertiesPage() {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Map-related state
  const [propertyCoordinates, setPropertyCoordinates] = useState<PropertyCoordinate[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Handle property actions
  const handlePropertyEdit = (property: PropertyListItem) => {
    console.log("🔄 Navigating to property detail:", {
      propertyId: property.id,
      propertyName: property.name,
      targetUrl: `/dashboard/superadmin/properties/${property.id}`
    });
    // Navigate to view page (superadmin can only view, not edit)
    router.push(`/dashboard/superadmin/properties/${property.id}`);
  };

  const handlePropertyApprove = (property: PropertyListItem) => {
    setSelectedProperty(property);
    setApprovalDialogOpen(true);
  };

  const handlePropertyReject = (property: PropertyListItem) => {
    setSelectedProperty(property);
    setApprovalDialogOpen(true);
  };

  const handleApprovalSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fetch property coordinates for map
  const fetchPropertyCoordinates = async () => {
    try {
      setMapLoading(true);
      setMapError(null);

      const response = await fetch("/api/properties/coordinates");

      if (!response.ok) {
        throw new Error("Failed to fetch property coordinates");
      }

      const data: PropertyCoordinate[] = await response.json();
      setPropertyCoordinates(data);
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setMapLoading(false);
    }
  };

  // Handle property click from map
  const handlePropertyClick = (property: PropertyCoordinate) => {
    // Navigate to property detail page
    router.push(`/dashboard/superadmin/properties/${property.id}`);
  };

  // Fetch property coordinates on component mount
  useEffect(() => {
    fetchPropertyCoordinates();
  }, []);

  const statusTabs = [
    {
      value: "all",
      label: "Semua",
      icon: Building2,
      filter: "",
    },
    {
      value: "pending",
      label: "Menunggu Review",
      icon: Clock,
      filter: PropertyStatus.PENDING,
      color: "text-yellow-600",
    },
    {
      value: "approved",
      label: "Disetujui",
      icon: CheckCircle,
      filter: PropertyStatus.APPROVED,
      color: "text-green-600",
    },
    {
      value: "rejected",
      label: "Ditolak",
      icon: XCircle,
      filter: PropertyStatus.REJECTED,
      color: "text-red-600",
    },
    {
      value: "suspended",
      label: "Disuspend",
      icon: AlertCircle,
      filter: PropertyStatus.SUSPENDED,
      color: "text-orange-600",
    },
  ];

  return (
    <DashboardLayout title="Manajemen Properti">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Properti</h1>
            <p className="text-muted-foreground">
              Review dan kelola semua properti yang terdaftar di platform
            </p>
          </div>
          <div className="flex gap-2">
          </div>
          <div className="flex gap-2">
          </div>
        </div>

        {/* Statistics Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Statistik Platform</h2>
          <SuperadminPropertyStats key={refreshKey} />
        </div>

        {/* Property Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Peta Lokasi Properti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyMapView
              properties={propertyCoordinates}
              loading={mapLoading}
              error={mapError}
              onPropertyClick={handlePropertyClick}
              height="500px"
              className="rounded-lg border"
            />
          </CardContent>
        </Card>

        {/* Property Management Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {statusTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${tab.color || ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {statusTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-6">
              <div className="flex items-center justify-between">
                {tab.value === "pending" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Perlu Review
                  </Badge>
                )}
              </div>

              <PropertyList
                key={`${tab.value}-${refreshKey}`}
                onPropertyEdit={handlePropertyEdit}
                onPropertyApprove={handlePropertyApprove}
                onPropertyReject={handlePropertyReject}
                showActions={true}
                showOwner={true}
                showCreateButton={false}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Property Approval Dialog */}
        <PropertyApprovalDialog
          property={selectedProperty}
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          onSuccess={handleApprovalSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
