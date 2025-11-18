"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Advertisement } from "@/app/(protected-pages)/dashboard/superadmin/iklan/page";
import Image from "next/image";
import { getCloudinaryUrl } from "@/lib/cloudinary";

interface IklanTableProps {
  data: Advertisement[];
  isLoading: boolean;
  onEdit: (ad: Advertisement) => void;
  onDelete: (id: string) => void;
}

export function IklanTable({ data, isLoading, onEdit, onDelete }: IklanTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Iklan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Iklan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Belum ada iklan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Iklan ({data.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Gambar</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="w-[100px]">Urutan</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right w-[150px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((ad) => {
                // Use publicId if available, otherwise fallback to imageUrl
                const imageUrl = ad.publicId
                  ? getCloudinaryUrl(ad.publicId)
                  : ad.imageUrl;

                return (
                <TableRow key={ad.id}>
                  <TableCell>
                    <div className="relative w-20 h-12 rounded overflow-hidden bg-muted">
                      <Image
                        src={imageUrl}
                        alt={ad.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{ad.title}</p>
                      {ad.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {ad.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ad.linkUrl ? (
                      <a
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Link
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ad.sortOrder}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ad.isActive ? "default" : "secondary"}>
                      {ad.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {ad.startDate && (
                        <p className="text-muted-foreground">
                          Mulai: {new Date(ad.startDate).toLocaleDateString("id-ID")}
                        </p>
                      )}
                      {ad.endDate && (
                        <p className="text-muted-foreground">
                          Selesai: {new Date(ad.endDate).toLocaleDateString("id-ID")}
                        </p>
                      )}
                      {!ad.startDate && !ad.endDate && (
                        <span className="text-muted-foreground">Permanen</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(ad)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(ad.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
