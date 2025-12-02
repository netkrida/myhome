"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApprovedAdvertisementsProps {
  advertisements: AdvertisementDTO[];
  isLoading: boolean;
  onPlace: (id: string, layoutSlot: number) => void;
  onRefresh: () => void;
}

export function ApprovedAdvertisements({
  advertisements,
  isLoading,
  onPlace,
}: ApprovedAdvertisementsProps) {
  const [placeDialogOpen, setPlaceDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdvertisementDTO | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("1");
  const [previewAd, setPreviewAd] = useState<AdvertisementDTO | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Iklan Siap Dipasang</CardTitle>
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
          <CardTitle>Iklan Siap Dipasang</CardTitle>
          <CardDescription>Belum ada iklan yang disetujui dan siap dipasang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Tidak ada iklan yang menunggu untuk dipasang di layout
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePlaceClick = (ad: AdvertisementDTO) => {
    setSelectedAd(ad);
    setSelectedSlot("1");
    setPlaceDialogOpen(true);
  };

  const handlePlaceConfirm = () => {
    if (selectedAd) {
      onPlace(selectedAd.id, parseInt(selectedSlot, 10));
      setPlaceDialogOpen(false);
      setSelectedAd(null);
      setSelectedSlot("1");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Iklan Siap Dipasang ({advertisements.length})</CardTitle>
          <CardDescription>
            Iklan yang sudah disetujui dan menunggu untuk dipasang di layout carousel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {advertisements.map((ad) => {
              const imageUrl = ad.publicId ? getCloudinaryUrl(ad.publicId) : ad.imageUrl;

              return (
                <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
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
                      <Badge className="absolute top-2 right-2 bg-green-600">Approved</Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold mb-2">{ad.title}</h3>
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
                          <span className="font-medium">Disetujui oleh:</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {ad.reviewedByName || "Unknown"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Waktu approval:</span>
                          <span className="text-muted-foreground">
                            {ad.reviewedAt
                              ? format(new Date(ad.reviewedAt), "dd MMM yyyy HH:mm")
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
                        <Button size="sm" onClick={() => handlePlaceClick(ad)}>
                          <MapPin className="h-4 w-4 mr-2" />
                          Pasang di Layout
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

      {/* Place Dialog */}
      <Dialog open={placeDialogOpen} onOpenChange={setPlaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pasang Iklan di Layout</DialogTitle>
            <DialogDescription>
              Pilih slot carousel untuk menempatkan iklan <strong>{selectedAd?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Slot Carousel</label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih slot carousel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Slot 1 - Carousel Utama (Atas)</SelectItem>
                  <SelectItem value="2">Slot 2 - Carousel Sekunder (Bawah)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Slot 1: Carousel yang sudah ada di halaman utama
                <br />
                Slot 2: Carousel baru yang akan ditambahkan di bawah carousel utama
              </p>
            </div>

            {selectedAd && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="relative w-full h-40 rounded overflow-hidden">
                  <Image
                    src={
                      selectedAd.publicId
                        ? getCloudinaryUrl(selectedAd.publicId)
                        : selectedAd.imageUrl
                    }
                    alt={selectedAd.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-sm mt-2">{selectedAd.title}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlaceDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handlePlaceConfirm}>Pasang Sekarang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
