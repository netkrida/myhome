"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt,
  User,
  Building2,
  DoorOpen,
  Calendar,
  CreditCard,
  Hash,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface TransactionDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
}

interface TransactionDetail {
  id: string;
  midtransOrderId: string;
  status: string;
  paymentType: string;
  paymentMethod: string | null;
  amount: number;
  transactionTime: Date | null;
  transactionId: string | null;
  expiryTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payer: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  booking: {
    bookingCode: string;
    leaseType: string;
    room: {
      roomNumber: string;
      roomType: string;
      floor: number;
    };
    property: {
      id: string;
      name: string;
      owner: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
}

export function TransactionDetailDialog({
  isOpen,
  onClose,
  transactionId,
}: TransactionDetailDialogProps) {
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchDetail();
    }
  }, [isOpen, transactionId]);

  const fetchDetail = async () => {
    if (!transactionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/superadmin/transactions/${transactionId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setDetail(result.data);
      }
    } catch (error) {
      console.error("Error fetching transaction detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      SUCCESS: {
        label: "Success",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      },
      PENDING: {
        label: "Pending",
        className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      },
      FAILED: {
        label: "Failed",
        className: "bg-rose-500/10 text-rose-700 border-rose-500/20",
      },
      EXPIRED: {
        label: "Expired",
        className: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
      },
      REFUNDED: {
        label: "Refunded",
        className: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
      },
    };

    const statusConfig = config[status] || config["PENDING"];
    if (!statusConfig) return null;
    return (
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Detail Transaksi
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Informasi Pembayaran</h3>
                  {getStatusBadge(detail.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Midtrans Order ID
                    </p>
                    <p className="font-mono text-sm font-medium">
                      {detail.midtransOrderId}
                    </p>
                  </div>

                  {detail.transactionId && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Transaction ID
                      </p>
                      <p className="font-mono text-sm font-medium">
                        {detail.transactionId}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tipe Pembayaran
                    </p>
                    <Badge variant="secondary">{detail.paymentType}</Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Metode Pembayaran
                    </p>
                    <p className="text-sm font-medium">
                      {detail.paymentMethod || "-"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Waktu Transaksi
                    </p>
                    <p className="text-sm font-medium">
                      {detail.transactionTime
                        ? format(
                            new Date(detail.transactionTime),
                            "dd MMMM yyyy, HH:mm",
                            { locale: localeId }
                          )
                        : "-"}
                    </p>
                  </div>

                  {detail.expiryTime && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Waktu Kadaluarsa
                      </p>
                      <p className="text-sm font-medium">
                        {format(new Date(detail.expiryTime), "dd MMMM yyyy, HH:mm", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(detail.amount)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Payer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Pembayar
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{detail.payer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{detail.payer.email}</span>
                  </div>
                  {detail.payer.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{detail.payer.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Booking Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Informasi Booking
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Booking Code</p>
                    <p className="font-mono text-sm font-medium">
                      {detail.booking.bookingCode}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lease Type</p>
                    <Badge variant="outline">{detail.booking.leaseType}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Room & Property Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informasi Kamar & Properti
                </h3>

                <div className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <DoorOpen className="h-4 w-4" />
                      Kamar
                    </p>
                    <p className="font-medium">
                      {detail.booking.room.roomNumber} - {detail.booking.room.roomType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lantai {detail.booking.room.floor}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Properti
                    </p>
                    <p className="font-medium">{detail.booking.property.name}</p>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Pemilik Kos
                    </p>
                    <p className="font-medium">{detail.booking.property.owner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.booking.property.owner.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Transaksi tidak ditemukan
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

