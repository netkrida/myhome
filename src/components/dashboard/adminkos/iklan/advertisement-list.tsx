"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, ExternalLink, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import type { AdvertisementDTO } from "@/server/types/advertisement.types";
import { format } from "date-fns";
import Image from "next/image";
import { getCloudinaryUrl } from "@/lib/cloudinary-utils";

interface AdvertisementListProps {
  advertisements: AdvertisementDTO[];
  isLoading: boolean;
  onEdit: (ad: AdvertisementDTO) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function AdvertisementList({
  advertisements,
  isLoading,
  onEdit,
  onDelete,
}: AdvertisementListProps) {
  const [activeTab, setActiveTab] = useState("all");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Iklan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingAds = advertisements.filter((ad) => ad.status === "PENDING");
  const approvedAds = advertisements.filter((ad) => ad.status === "APPROVED");
  const placedAds = advertisements.filter((ad) => ad.status === "PLACED");
  const rejectedAds = advertisements.filter((ad) => ad.status === "REJECTED");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "PLACED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="h-3 w-3 mr-1" />
            Terpasang (Slot {(advertisements.find(ad => ad.status === "PLACED") as any)?.layoutSlot || '-'})
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderAdvertisementCard = (ad: AdvertisementDTO) => {
    const imageUrl = ad.publicId ? getCloudinaryUrl(ad.publicId) : ad.imageUrl;
    const canEdit = ["PENDING", "APPROVED"].includes(ad.status);
    const canDelete = ["PENDING", "REJECTED"].includes(ad.status);

    return (
      <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full md:w-64 h-48 md:h-auto bg-muted">
            <Image
              src={imageUrl}
              alt={ad.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{ad.title}</h3>
                  {getStatusBadge(ad.status)}
                </div>
                {ad.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid gap-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Diajukan:</span>
                <span>{format(new Date(ad.submittedAt), "dd MMM yyyy HH:mm")}</span>
              </div>

              {ad.reviewedAt && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {ad.status === "REJECTED" ? "Ditolak:" : "Disetujui:"}
                  </span>
                  <span>{format(new Date(ad.reviewedAt), "dd MMM yyyy HH:mm")}</span>
                  {ad.reviewedByName && <span>oleh {ad.reviewedByName}</span>}
                </div>
              )}

              {ad.status === "PLACED" && ad.placedAt && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Dipasang:</span>
                  <span>{format(new Date(ad.placedAt), "dd MMM yyyy HH:mm")}</span>
                  {ad.layoutSlot && <span className="font-semibold">• Slot {ad.layoutSlot}</span>}
                </div>
              )}

              {ad.status === "REJECTED" && ad.rejectionReason && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-red-600">Alasan Penolakan:</span>
                  <span className="text-red-600">{ad.rejectionReason}</span>
                </div>
              )}

              {(ad.startDate || ad.endDate) && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Periode:</span>
                  <span>
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
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {ad.linkUrl.substring(0, 40)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(ad)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDelete(ad.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
              )}
              {ad.status === "PLACED" && (
                <Badge variant="secondary" className="ml-auto">
                  Aktif
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Iklan</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              Semua ({advertisements.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingAds.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Disetujui ({approvedAds.length})
            </TabsTrigger>
            <TabsTrigger value="placed">
              Terpasang ({placedAds.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Ditolak ({rejectedAds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {advertisements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Belum ada iklan yang diajukan</p>
              </div>
            ) : (
              advertisements.map(renderAdvertisementCard)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingAds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada iklan yang menunggu review</p>
              </div>
            ) : (
              pendingAds.map(renderAdvertisementCard)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedAds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada iklan yang disetujui</p>
              </div>
            ) : (
              approvedAds.map(renderAdvertisementCard)
            )}
          </TabsContent>

          <TabsContent value="placed" className="space-y-4">
            {placedAds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada iklan yang terpasang</p>
              </div>
            ) : (
              placedAds.map(renderAdvertisementCard)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedAds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada iklan yang ditolak</p>
              </div>
            ) : (
              rejectedAds.map(renderAdvertisementCard)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
