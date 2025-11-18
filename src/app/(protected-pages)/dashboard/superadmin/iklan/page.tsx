"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { IklanTable } from "@/components/dashboard/superadmin/iklan/iklan-table";
import { IklanFormDialog } from "@/components/dashboard/superadmin/iklan/iklan-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  publicId: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function IklanPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/superadmin/iklan");
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

  const handleCreate = () => {
    setEditingAd(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setIsFormOpen(true);
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
    setIsFormOpen(false);
    setEditingAd(null);
    fetchAdvertisements();
  };

  return (
    <DashboardLayout title="Iklan">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Iklan</h1>
            <p className="text-muted-foreground mt-1">
              Kelola iklan yang akan ditampilkan di halaman depan
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Iklan
          </Button>
        </div>

        {/* Table */}
        <IklanTable
          data={advertisements}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Form Dialog */}
        <IklanFormDialog
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAd(null);
          }}
          onSuccess={handleFormSuccess}
          editingAd={editingAd}
        />
      </div>
    </DashboardLayout>
  );
}
