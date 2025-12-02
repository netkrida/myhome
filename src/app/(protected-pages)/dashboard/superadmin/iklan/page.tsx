"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingAdvertisements } from "@/components/dashboard/superadmin/iklan/pending-advertisements";
import { ApprovedAdvertisements } from "@/components/dashboard/superadmin/iklan/approved-advertisements";
import { LayoutManagement } from "@/components/dashboard/superadmin/iklan/layout-management";
import { AllAdvertisements } from "@/components/dashboard/superadmin/iklan/all-advertisements";
import type { AdvertisementDTO } from "@/server/types/advertisement.types";

export default function SuperAdminIklanPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingAds, setPendingAds] = useState<AdvertisementDTO[]>([]);
  const [approvedAds, setApprovedAds] = useState<AdvertisementDTO[]>([]);
  const [placedAds, setPlacedAds] = useState<AdvertisementDTO[]>([]);
  const [allAds, setAllAds] = useState<AdvertisementDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPendingAdvertisements(),
        fetchApprovedAdvertisements(),
        fetchPlacedAdvertisements(),
        fetchAllAdvertisements(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingAdvertisements = async () => {
    try {
      const response = await fetch("/api/superadmin/iklan?status=PENDING");
      const result = await response.json();
      if (result.success) {
        setPendingAds(result.data);
      }
    } catch (error) {
      console.error("Error fetching pending advertisements:", error);
    }
  };

  const fetchApprovedAdvertisements = async () => {
    try {
      const response = await fetch("/api/superadmin/iklan?status=APPROVED");
      const result = await response.json();
      if (result.success) {
        setApprovedAds(result.data);
      }
    } catch (error) {
      console.error("Error fetching approved advertisements:", error);
    }
  };

  const fetchPlacedAdvertisements = async () => {
    try {
      const response = await fetch("/api/superadmin/iklan?status=PLACED");
      const result = await response.json();
      if (result.success) {
        setPlacedAds(result.data);
      }
    } catch (error) {
      console.error("Error fetching placed advertisements:", error);
    }
  };

  const fetchAllAdvertisements = async () => {
    try {
      const response = await fetch("/api/superadmin/iklan");
      const result = await response.json();
      if (result.success) {
        setAllAds(result.data);
      }
    } catch (error) {
      console.error("Error fetching all advertisements:", error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/superadmin/iklan/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Iklan berhasil disetujui!");
        fetchAllData();
      } else {
        toast.error(result.error || "Gagal menyetujui iklan");
      }
    } catch (error) {
      console.error("Error approving advertisement:", error);
      toast.error("Gagal menyetujui iklan");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/superadmin/iklan/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectionReason: reason }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Iklan berhasil ditolak!");
        fetchAllData();
      } else {
        toast.error(result.error || "Gagal menolak iklan");
      }
    } catch (error) {
      console.error("Error rejecting advertisement:", error);
      toast.error("Gagal menolak iklan");
    }
  };

  const handlePlace = async (id: string, layoutSlot: number) => {
    try {
      const response = await fetch(`/api/superadmin/iklan/${id}/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutSlot }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Iklan berhasil dipasang!");
        fetchAllData();
      } else {
        toast.error(result.error || "Gagal memasang iklan");
      }
    } catch (error) {
      console.error("Error placing advertisement:", error);
      toast.error("Gagal memasang iklan");
    }
  };

  const handleRemoveFromLayout = async (id: string) => {
    try {
      const response = await fetch(`/api/superadmin/iklan/${id}/place`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Iklan berhasil dihapus dari layout!");
        fetchAllData();
      } else {
        toast.error(result.error || "Gagal menghapus iklan dari layout");
      }
    } catch (error) {
      console.error("Error removing advertisement from layout:", error);
      toast.error("Gagal menghapus iklan dari layout");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus iklan ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/iklan/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Iklan berhasil dihapus!");
        fetchAllData();
      } else {
        toast.error(result.error || "Gagal menghapus iklan");
      }
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast.error("Gagal menghapus iklan");
    }
  };

  return (
    <DashboardLayout title="Manajemen Iklan">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Iklan</h1>
            <p className="text-muted-foreground mt-1">
              Kelola pengajuan iklan, approval, dan layout pemasangan
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchAllData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Menunggu Approval</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{pendingAds.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Disetujui</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{approvedAds.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Terpasang</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{placedAds.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Iklan</div>
            <div className="text-2xl font-bold mt-1">{allAds.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Antrian Approval ({pendingAds.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Siap Dipasang ({approvedAds.length})
            </TabsTrigger>
            <TabsTrigger value="layout">
              Layout Management
            </TabsTrigger>
            <TabsTrigger value="all">
              Semua Iklan ({allAds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <PendingAdvertisements
              advertisements={pendingAds}
              isLoading={isLoading}
              onApprove={handleApprove}
              onReject={handleReject}
              onRefresh={fetchPendingAdvertisements}
            />
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <ApprovedAdvertisements
              advertisements={approvedAds}
              isLoading={isLoading}
              onPlace={handlePlace}
              onRefresh={fetchApprovedAdvertisements}
            />
          </TabsContent>

          <TabsContent value="layout" className="mt-6">
            <LayoutManagement
              advertisements={placedAds}
              isLoading={isLoading}
              onRemove={handleRemoveFromLayout}
              onRefresh={fetchPlacedAdvertisements}
            />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <AllAdvertisements
              advertisements={allAds}
              isLoading={isLoading}
              onDelete={handleDelete}
              onRefresh={fetchAllAdvertisements}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
