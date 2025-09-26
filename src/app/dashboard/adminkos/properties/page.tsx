"use client";

import { useState } from "react";
import { PropertyList, PropertyStats, PropertyApprovalDialog } from "@/components/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, BarChart3 } from "lucide-react";
import type { PropertyListItem } from "@/server/types";

export default function PropertiesPage() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle property actions
  const handlePropertyEdit = (property: PropertyListItem) => {
    // Navigate to edit page
    window.location.href = `/dashboard/adminkos/properties/${property.id}/edit`;
  };

  const handlePropertyDelete = async (property: PropertyListItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus properti "${property.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete property");
      }

      // Refresh the list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Gagal menghapus properti");
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properti Saya</h1>
          <p className="text-muted-foreground">
            Kelola properti kos Anda dan pantau performanya
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/adminkos/properties/create">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Properti
          </a>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Daftar Properti
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Statistik Properti</h2>
            <PropertyStats key={refreshKey} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => window.location.href = '/dashboard/adminkos/properties/create'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Tambah Properti Baru
                </CardTitle>
                <CardDescription>
                  Daftarkan properti kos baru Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mulai proses pendaftaran properti dengan wizard yang mudah diikuti
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/dashboard/adminkos/rooms'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Kelola Kamar
                </CardTitle>
                <CardDescription>
                  Atur kamar dan ketersediaan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tambah, edit, dan kelola ketersediaan kamar di semua properti
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/dashboard/adminkos/bookings'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Laporan & Analitik
                </CardTitle>
                <CardDescription>
                  Lihat performa properti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analisis okupansi, pendapatan, dan tren booking
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Properties */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Properti Terbaru</h2>
              <Button variant="outline" asChild>
                <a href="/dashboard/adminkos/properties?tab=properties">
                  Lihat Semua
                </a>
              </Button>
            </div>
            <PropertyList
              key={`recent-${refreshKey}`}
              onPropertyEdit={handlePropertyEdit}
              onPropertyDelete={handlePropertyDelete}
              onPropertyApprove={handlePropertyApprove}
              onPropertyReject={handlePropertyReject}
              showCreateButton={false}
            />
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <PropertyList
            key={`all-${refreshKey}`}
            onPropertyEdit={handlePropertyEdit}
            onPropertyDelete={handlePropertyDelete}
            onPropertyApprove={handlePropertyApprove}
            onPropertyReject={handlePropertyReject}
          />
        </TabsContent>
      </Tabs>

      {/* Property Approval Dialog */}
      <PropertyApprovalDialog
        property={selectedProperty}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onSuccess={handleApprovalSuccess}
      />
    </div>
  );
}
