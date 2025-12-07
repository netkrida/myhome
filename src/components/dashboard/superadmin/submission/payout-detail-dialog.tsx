"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, User, CreditCard, Wallet, FileText, Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { PayoutDetail } from "@/server/types/bank-account";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PayoutDetailDialogProps {
  payout: PayoutDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500 text-white",
  APPROVED: "bg-green-500 text-white",
  REJECTED: "bg-red-500 text-white",
  COMPLETED: "bg-blue-500 text-white",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  COMPLETED: "Selesai",
};

export function PayoutDetailDialog({ payout, open, onOpenChange }: PayoutDetailDialogProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  if (!payout) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Penarikan</DialogTitle>
          <DialogDescription>
            Informasi lengkap pengajuan penarikan dana dari AdminKos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={statusColors[payout.status]}>
              {statusLabels[payout.status]}
            </Badge>
          </div>

          <Separator />

          {/* AdminKos Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informasi AdminKos
            </h4>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{payout.adminKosName || "Unknown"}</span>
              </div>
              <p className="text-sm text-muted-foreground">{payout.adminKosEmail}</p>
            </div>
          </div>

          <Separator />

          {/* Payout Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Detail Penarikan
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-medium">Jumlah Penarikan</span>
                </div>
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(payout.amount)}
                </div>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-medium">Sisa Saldo</span>
                </div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(payout.balanceAfter)}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Sebelumnya:</span>
                <span className="font-medium">{formatCurrency(payout.balanceBefore)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sumber:</span>
                <span className="font-medium">
                  {payout.source === "SALES" ? "Hasil Penjualan" : payout.source === "DEPOSIT" ? "Deposit" : "Lainnya"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Pengajuan:</span>
                <span className="font-medium">
                  {format(new Date(payout.createdAt), "d MMMM yyyy, HH:mm", { locale: idLocale })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bank Account Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Rekening Tujuan
            </h4>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{payout.bankAccount?.bankName}</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nomor Rekening:</span>
                  <span className="font-mono font-medium">{payout.bankAccount?.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Pemilik:</span>
                  <span className="font-medium">{payout.bankAccount?.accountName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payout.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Catatan
                </h4>
                <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                  {payout.notes}
                </div>
              </div>
            </>
          )}

          {/* Rejection Reason */}
          {payout.status === "REJECTED" && payout.rejectionReason && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Alasan Penolakan
                </h4>
                <div className="rounded-lg border bg-red-50 dark:bg-red-950 p-4 text-sm text-red-900 dark:text-red-100">
                  {payout.rejectionReason}
                </div>
              </div>
            </>
          )}

          {/* Attachments */}
          {payout.attachments && payout.attachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Bukti Transfer
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {payout.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative rounded-lg border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {attachment.fileType.startsWith("image/") ? (
                        <div className="relative aspect-video">
                          <Image
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            fill
                            className="object-cover cursor-pointer"
                            onClick={() => setSelectedImage(attachment.fileUrl)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedImage(attachment.fileUrl)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Lihat
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video flex flex-col items-center justify-center p-4">
                          <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-center truncate w-full">
                            {attachment.fileName}
                          </p>
                        </div>
                      )}
                      <div className="p-2 border-t bg-background/50">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full"
                          asChild
                        >
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Processed Info */}
          {payout.processedAt && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p>
                  Diproses oleh {payout.processorName || "Unknown"} pada{" "}
                  {format(new Date(payout.processedAt), "d MMMM yyyy, HH:mm", { locale: idLocale })}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bukti Transfer</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-[70vh]">
              <Image
                src={selectedImage}
                alt="Bukti Transfer"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

