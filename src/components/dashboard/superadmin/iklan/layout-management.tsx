"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, MoveVertical } from "lucide-react";
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

interface LayoutManagementProps {
  advertisements: AdvertisementDTO[];
  isLoading: boolean;
  onRemove: (id: string) => void;
  onRefresh: () => void;
}

export function LayoutManagement({
  advertisements,
  isLoading,
  onRemove,
}: LayoutManagementProps) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdvertisementDTO | null>(null);
  const [previewAd, setPreviewAd] = useState<AdvertisementDTO | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Layout Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by layout slot
  const slot1Ads = advertisements.filter((ad) => ad.layoutSlot === 1);
  const slot2Ads = advertisements.filter((ad) => ad.layoutSlot === 2);

  const handleRemoveClick = (ad: AdvertisementDTO) => {
    setSelectedAd(ad);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (selectedAd) {
      onRemove(selectedAd.id);
      setRemoveDialogOpen(false);
      setSelectedAd(null);
    }
  };

  const renderSlotSection = (slotNumber: number, ads: AdvertisementDTO[]) => {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MoveVertical className="h-5 w-5" />
                Slot {slotNumber} - {slotNumber === 1 ? "Carousel Utama" : "Carousel Sekunder"}
              </CardTitle>
              <CardDescription>
                {slotNumber === 1
                  ? "Carousel yang sudah ada di bagian atas halaman utama"
                  : "Carousel baru di bawah section property listing"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {ads.length} Iklan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {ads.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                Belum ada iklan yang dipasang di slot ini
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad, index) => {
                const imageUrl = ad.publicId ? getCloudinaryUrl(ad.publicId) : ad.imageUrl;

                return (
                  <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {/* Position Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-blue-600">
                          Posisi {index + 1}
                        </Badge>
                      </div>

                      {/* Image Preview */}
                      <div
                        className="relative w-full md:w-80 h-56 bg-muted cursor-pointer"
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
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="mb-4">
                          <div className="flex items-start justify-between">
                            <h3 className="text-xl font-semibold mb-2">{ad.title}</h3>
                            <Badge
                              variant={ad.isActive ? "default" : "secondary"}
                              className={ad.isActive ? "bg-green-600" : ""}
                            >
                              {ad.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                          {ad.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ad.description}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Diajukan oleh:</span>
                            <Badge variant="secondary">{ad.submittedByName || "Unknown"}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Dipasang:</span>
                            <span className="text-muted-foreground">
                              {ad.placedAt
                                ? format(new Date(ad.placedAt), "dd MMM yyyy HH:mm")
                                : "-"}
                            </span>
                          </div>
                          {(ad.startDate || ad.endDate) && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Periode:</span>
                              <span className="text-muted-foreground">
                                {ad.startDate
                                  ? format(new Date(ad.startDate), "dd MMM yyyy")
                                  : "Sekarang"}{" "}
                                -{" "}
                                {ad.endDate
                                  ? format(new Date(ad.endDate), "dd MMM yyyy")
                                  : "Tidak terbatas"}
                              </span>
                            </div>
                          )}
                          {ad.linkUrl && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Link:</span>
                              <a
                                href={ad.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm truncate max-w-md"
                              >
                                {ad.linkUrl}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveClick(ad)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus dari Layout
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
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MoveVertical className="h-5 w-5" />
              Layout Management
            </CardTitle>
            <CardDescription>
              Kelola iklan yang sudah dipasang di carousel. Total: {advertisements.length} iklan
              terpasang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Carousel Utama</p>
                  <p className="text-sm text-muted-foreground">{slot1Ads.length} iklan aktif</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="text-xl font-bold text-purple-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Carousel Sekunder</p>
                  <p className="text-sm text-muted-foreground">{slot2Ads.length} iklan aktif</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slot 1 */}
        {renderSlotSection(1, slot1Ads)}

        {/* Slot 2 */}
        {renderSlotSection(2, slot2Ads)}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dari Layout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus iklan <strong>{selectedAd?.title}</strong> dari
              layout? Iklan akan kembali ke status &quot;Approved&quot; dan dapat dipasang kembali
              nanti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus dari Layout
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
