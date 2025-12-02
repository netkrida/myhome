"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Filter } from "lucide-react";
import type { AdvertisementDTO } from "@/server/types/advertisement.types";
import { format } from "date-fns";
import Image from "next/image";
import { getCloudinaryUrl } from "@/lib/cloudinary-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AllAdvertisementsProps {
  advertisements: AdvertisementDTO[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function AllAdvertisements({
  advertisements,
  isLoading,
  onDelete,
}: AllAdvertisementsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdvertisementDTO | null>(null);
  const [previewAd, setPreviewAd] = useState<AdvertisementDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Semua Iklan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDeleteClick = (ad: AdvertisementDTO) => {
    setSelectedAd(ad);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedAd) {
      onDelete(selectedAd.id);
      setDeleteDialogOpen(false);
      setSelectedAd(null);
    }
  };

  // Filter advertisements
  const filteredAds =
    statusFilter === "ALL"
      ? advertisements
      : advertisements.filter((ad) => ad.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Approved
          </Badge>
        );
      case "PLACED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Placed
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCounts = {
    ALL: advertisements.length,
    PENDING: advertisements.filter((ad) => ad.status === "PENDING").length,
    APPROVED: advertisements.filter((ad) => ad.status === "APPROVED").length,
    PLACED: advertisements.filter((ad) => ad.status === "PLACED").length,
    REJECTED: advertisements.filter((ad) => ad.status === "REJECTED").length,
    EXPIRED: advertisements.filter((ad) => ad.status === "EXPIRED").length,
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Semua Iklan ({filteredAds.length})</CardTitle>
              <CardDescription>Daftar lengkap semua iklan dari semua status</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua ({statusCounts.ALL})</SelectItem>
                  <SelectItem value="PENDING">Pending ({statusCounts.PENDING})</SelectItem>
                  <SelectItem value="APPROVED">Approved ({statusCounts.APPROVED})</SelectItem>
                  <SelectItem value="PLACED">Placed ({statusCounts.PLACED})</SelectItem>
                  <SelectItem value="REJECTED">Rejected ({statusCounts.REJECTED})</SelectItem>
                  <SelectItem value="EXPIRED">Expired ({statusCounts.EXPIRED})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAds.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                {statusFilter === "ALL"
                  ? "Belum ada iklan"
                  : `Tidak ada iklan dengan status ${statusFilter}`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAds.map((ad) => {
                const imageUrl = ad.publicId ? getCloudinaryUrl(ad.publicId) : ad.imageUrl;

                return (
                  <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {/* Image Preview */}
                      <div
                        className="relative w-full md:w-72 h-48 bg-muted cursor-pointer"
                        onClick={() => setPreviewAd(ad)}
                      >
                        <Image
                          src={imageUrl}
                          alt={ad.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white" />
                        </div>
                        {ad.status === "PLACED" && ad.layoutSlot && (
                          <Badge className="absolute top-2 right-2 bg-blue-600">
                            Slot {ad.layoutSlot}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold">{ad.title}</h3>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(ad.status)}
                              {ad.isActive ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </div>
                          {ad.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ad.description}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Diajukan oleh:</span>
                            <Badge variant="secondary" className="text-xs">
                              {ad.submittedByName || "Unknown"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Waktu pengajuan:</span>
                            <span className="text-muted-foreground text-xs">
                              {format(new Date(ad.submittedAt), "dd MMM yyyy HH:mm")}
                            </span>
                          </div>

                          {ad.reviewedAt && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Direview oleh:</span>
                                <Badge variant="outline" className="text-xs">
                                  {ad.reviewedByName || "Unknown"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Waktu review:</span>
                                <span className="text-muted-foreground text-xs">
                                  {format(new Date(ad.reviewedAt), "dd MMM yyyy HH:mm")}
                                </span>
                              </div>
                            </>
                          )}

                          {ad.placedAt && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Dipasang:</span>
                              <span className="text-muted-foreground text-xs">
                                {format(new Date(ad.placedAt), "dd MMM yyyy HH:mm")}
                              </span>
                            </div>
                          )}

                          {(ad.startDate || ad.endDate) && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Periode:</span>
                              <span className="text-muted-foreground text-xs">
                                {ad.startDate
                                  ? format(new Date(ad.startDate), "dd MMM yyyy")
                                  : "Now"}{" "}
                                - {ad.endDate ? format(new Date(ad.endDate), "dd MMM yyyy") : "∞"}
                              </span>
                            </div>
                          )}
                        </div>

                        {ad.status === "REJECTED" && ad.rejectionReason && (
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                              Alasan Penolakan:
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {ad.rejectionReason}
                            </p>
                          </div>
                        )}

                        {ad.linkUrl && (
                          <div className="mb-4">
                            <a
                              href={ad.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              🔗 {ad.linkUrl.substring(0, 50)}
                              {ad.linkUrl.length > 50 ? "..." : ""}
                            </a>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(ad)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Iklan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus iklan <strong>{selectedAd?.title}</strong>? Aksi
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      {previewAd && (
        <Dialog open={!!previewAd} onOpenChange={() => setPreviewAd(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewAd.title}</DialogTitle>
              <DialogDescription>
                {previewAd.description || "Preview gambar iklan"}
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full h-96">
              <Image
                src={
                  previewAd.publicId ? getCloudinaryUrl(previewAd.publicId) : previewAd.imageUrl
                }
                alt={previewAd.title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewAd(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
