"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdvertisementSubmitDialog } from "@/components/dashboard/adminkos/iklan/advertisement-submit-dialog";
import { AdvertisementList } from "@/components/dashboard/adminkos/iklan/advertisement-list";
import type { AdvertisementDTO } from "@/server/types/advertisement.types";

export default function AdminKosIklanPage() {
  const [advertisements, setAdvertisements] = useState<AdvertisementDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdvertisementDTO | null>(null);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/adminkos/iklan");
      const result = await response.json();

      if (result.success && result.data) {
        setAdvertisements(result.data);
      } else {
        toast.error(result.error || "Gagal memuat iklan");
      }
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      toast.error("Gagal memuat iklan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNew = () => {
    setEditingAd(null);
    setIsSubmitDialogOpen(true);
  };

  const handleEdit = (ad: AdvertisementDTO) => {
    setEditingAd(ad);
    setIsSubmitDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengajuan iklan ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/adminkos/iklan/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Iklan berhasil dihapus!");
        fetchAdvertisements();
      } else {
        toast.error(result.error || "Gagal menghapus iklan");
      }
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast.error("Gagal menghapus iklan");
    }
  };

  const handleFormSuccess = () => {
    setIsSubmitDialogOpen(false);
    setEditingAd(null);
    fetchAdvertisements();
  };

  // Group advertisements by status
  const pendingAds = advertisements.filter((ad) => ad.status === "PENDING");
  const approvedAds = advertisements.filter((ad) => ad.status === "APPROVED");
  const placedAds = advertisements.filter((ad) => ad.status === "PLACED");
  const rejectedAds = advertisements.filter((ad) => ad.status === "REJECTED");

  return (
    <DashboardLayout title="Iklan">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Iklan</h1>
            <p className="text-muted-foreground mt-1">
              Ajukan iklan untuk dipasang di halaman utama
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchAdvertisements}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleSubmitNew}>
              <Plus className="h-4 w-4 mr-2" />
              Ajukan Iklan
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Menunggu Review</div>
            <div className="text-2xl font-bold mt-1">{pendingAds.length}</div>
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
            <div className="text-sm font-medium text-muted-foreground">Ditolak</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{rejectedAds.length}</div>
          </div>
        </div>

        {/* Advertisement Lists */}
        <AdvertisementList
          advertisements={advertisements}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchAdvertisements}
        />

        {/* Submit Dialog */}
        <AdvertisementSubmitDialog
          open={isSubmitDialogOpen}
          onOpenChange={setIsSubmitDialogOpen}
          editingAd={editingAd}
          onSuccess={handleFormSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
