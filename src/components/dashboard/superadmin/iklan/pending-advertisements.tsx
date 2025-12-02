"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import type { AdvertisementDTO } from "@/server/types/advertisement.types";
import { format } from "date-fns";
import Image from "next/image";
import { getCloudinaryUrl } from "@/lib/cloudinary-utils";
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
import { Textarea } from "@/components/ui/textarea";

interface PendingAdvertisementsProps {
  advertisements: AdvertisementDTO[];
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRefresh: () => void;
}

export function PendingAdvertisements({
  advertisements,
  isLoading,
  onApprove,
  onReject,
}: PendingAdvertisementsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdvertisementDTO | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewAd, setPreviewAd] = useState<AdvertisementDTO | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Antrian Approval</CardTitle>
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

  if (advertisements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Antrian Approval</CardTitle>
          <CardDescription>Belum ada iklan yang menunggu approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada iklan yang perlu direview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRejectClick = (ad: AdvertisementDTO) => {
    setSelectedAd(ad);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedAd) {
      onReject(selectedAd.id, rejectionReason);
      setRejectDialogOpen(false);
      setSelectedAd(null);
      setRejectionReason("");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Antrian Approval ({advertisements.length})</CardTitle>
          <CardDescription>Review dan approve iklan yang diajukan oleh AdminKos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {advertisements.map((ad) => {
              const imageUrl = ad.publicId ? getCloudinaryUrl(ad.publicId) : ad.imageUrl;

              return (
                <Card key={ad.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Image Preview */}
                    <div className="relative w-full md:w-80 h-56 bg-muted cursor-pointer" onClick={() => setPreviewAd(ad)}>
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
                        <h3 className="text-xl font-semibold mb-2">{ad.title}</h3>
                        {ad.description && (
                          <p className="text-sm text-muted-foreground">{ad.description}</p>
                        )}
                      </div>

                      <div className="grid gap-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Diajukan oleh:</span>
                          <Badge variant="secondary">{ad.submittedByName || "Unknown"}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Waktu pengajuan:</span>
                          <span className="text-muted-foreground">
                            {format(new Date(ad.submittedAt), "dd MMM yyyy HH:mm")}
                          </span>
                        </div>
                        {(ad.startDate || ad.endDate) && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Periode:</span>
                            <span className="text-muted-foreground">
                              {ad.startDate ? format(new Date(ad.startDate), "dd MMM yyyy") : "Sekarang"} -{" "}
                              {ad.endDate ? format(new Date(ad.endDate), "dd MMM yyyy") : "Tidak terbatas"}
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
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => onApprove(ad.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(ad)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Tolak
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Iklan</AlertDialogTitle>
            <AlertDialogDescription>
              Berikan alasan penolakan untuk iklan <strong>{selectedAd?.title}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Masukkan alasan penolakan..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectConfirm} className="bg-red-600 hover:bg-red-700">
              Tolak Iklan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      {previewAd && (
        <AlertDialog open={!!previewAd} onOpenChange={() => setPreviewAd(null)}>
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{previewAd.title}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="relative w-full h-96">
              <Image
                src={previewAd.publicId ? getCloudinaryUrl(previewAd.publicId) : previewAd.imageUrl}
                alt={previewAd.title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Tutup</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
