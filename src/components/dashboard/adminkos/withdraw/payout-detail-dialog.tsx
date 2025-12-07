"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import type { PayoutDetail } from "@/server/types/bank-account";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PayoutDetailDialogProps {
  payout: PayoutDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING: {
    label: "Menunggu Persetujuan",
    icon: <Clock className="h-5 w-5" />,
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  },
  APPROVED: {
    label: "Disetujui",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  REJECTED: {
    label: "Ditolak",
    icon: <XCircle className="h-5 w-5" />,
    color: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  COMPLETED: {
    label: "Selesai",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
};

export function PayoutDetailDialog({ payout, open, onOpenChange }: PayoutDetailDialogProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!payout) return null;

  const status = statusConfig[payout.status] || statusConfig.PENDING;
  if (!status) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detail Penarikan Dana
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap pengajuan penarikan dana
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status.icon}
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(payout.createdAt), "d MMMM yyyy, HH:mm", { locale: idLocale })}
                </p>
              </div>

              <Separator />

              {/* Amount */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Jumlah Penarikan</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(payout.amount)}
                </p>
              </div>

              {/* Bank Account Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Rekening Tujuan
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nama Bank</p>
                    <p className="font-medium">{payout.bankAccount?.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                    <p className="font-medium font-mono">{payout.bankAccount?.accountNumber}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Nama Pemilik</p>
                    <p className="font-medium">{payout.bankAccount?.accountName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Balance Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informasi Saldo
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Saldo Sebelum</p>
                    <p className="font-semibold">{formatCurrency(payout.balanceBefore)}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Saldo Setelah</p>
                    <p className="font-semibold">{formatCurrency(payout.balanceAfter)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {payout.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Catatan</h3>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                      {payout.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Rejection Reason */}
              {payout.status === "REJECTED" && payout.rejectionReason && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Alasan Penolakan
                    </h3>
                    <p className="text-sm p-3 bg-red-50 text-red-900 rounded-lg border border-red-200">
                      {payout.rejectionReason}
                    </p>
                  </div>
                </>
              )}

              {/* Transfer Proof Attachments */}
              {payout.attachments && payout.attachments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Bukti Transfer
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
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

              {/* Processing Info */}
              {payout.processedAt && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Informasi Pemrosesan</h3>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <p className="text-muted-foreground">Diproses oleh</p>
                        <p className="font-medium">{payout.processorName || "Superadmin"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Waktu Pemrosesan</p>
                        <p className="font-medium">
                          {format(new Date(payout.processedAt), "d MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
