"use client";

import { useState } from "react";
import { PropertyList, SuperadminPropertyStats, PropertyApprovalDialog } from "@/components/dashboard/superadmin/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Building2, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users
} from "lucide-react";
import type { PropertyListItem } from "@/server/types";
import { PropertyStatus } from "@/server/types/property";

export default function SuperadminPropertiesPage() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle property actions
  const handlePropertyEdit = (property: PropertyListItem) => {
    // Navigate to view page (superadmin can only view, not edit)
    window.location.href = `/dashboard/superadmin/properties/${property.id}`;
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
        </div>

        {/* Statistics Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Statistik Platform</h2>
          <SuperadminPropertyStats key={refreshKey} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/dashboard/superadmin/properties?status=PENDING'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Perlu Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {/* This would be populated from stats */}
                -
              </div>
              <p className="text-xs text-muted-foreground">
                Properti menunggu persetujuan
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/dashboard/superadmin/users'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pemilik Kos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                -
              </div>
              <p className="text-xs text-muted-foreground">
                Total pemilik kos aktif
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/dashboard/superadmin/properties?status=APPROVED'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Properti Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                -
              </div>
              <p className="text-xs text-muted-foreground">
                Properti yang disetujui
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/dashboard/superadmin/analytics'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Laporan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                -
              </div>
              <p className="text-xs text-muted-foreground">
                Analitik platform
              </p>
            </CardContent>
          </Card>
        </div>

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
                <div>
                  <h2 className="text-xl font-semibold">
                    {tab.label === "Semua" ? "Semua Properti" : `Properti ${tab.label}`}
                  </h2>
                  <p className="text-muted-foreground">
                    {tab.label === "Semua" 
                      ? "Daftar lengkap semua properti di platform"
                      : `Properti dengan status ${tab.label.toLowerCase()}`
                    }
                  </p>
                </div>
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
