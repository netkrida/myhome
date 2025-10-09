"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, User, Phone, Mail, Calendar, DollarSign, Home } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface BookingDetailModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ActiveBookingDetail {
  id: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
  leaseType: string;
  checkInDate: string;
  checkOutDate: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    floor: number;
    propertyName: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
}

const bookingStatusConfig: Record<string, { label: string; color: string }> = {
  UNPAID: { label: "Belum Bayar", color: "bg-gray-500/10 text-gray-700 dark:text-gray-400" },
  DEPOSIT_PAID: { label: "DP Dibayar", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
  CONFIRMED: { label: "Dikonfirmasi", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  CHECKED_IN: { label: "Check In", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  COMPLETED: { label: "Selesai", color: "bg-slate-500/10 text-slate-700 dark:text-slate-400" },
  CANCELLED: { label: "Dibatalkan", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
  EXPIRED: { label: "Kadaluarsa", color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400" },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  SUCCESS: { label: "Berhasil", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  FAILED: { label: "Gagal", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
  PARTIAL: { label: "Sebagian", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
};

export function BookingDetailModal({
  roomId,
  isOpen,
  onClose,
}: BookingDetailModalProps) {
  const [booking, setBooking] = useState<ActiveBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchBookingDetail();
    }
  }, [isOpen, roomId]);

  const fetchBookingDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/adminkos/rooms/${roomId}/booking-active`);
      const result = await response.json();

      if (result.success && result.data) {
        setBooking(result.data);
      } else {
        setBooking(null);
      }
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Detail Booking</CardTitle>
              {booking && (
                <p className="text-sm text-muted-foreground mt-1">
                  Kamar #{booking.room.roomNumber} - {booking.room.propertyName}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          ) : !booking ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada booking aktif</p>
            </div>
          ) : (
            <>
              {/* Booking Code & Status */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Kode Booking
                  </label>
                  <p className="text-lg font-mono font-semibold mt-1">
                    {booking.bookingCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={bookingStatusConfig[booking.status]?.color || ""}>
                    {bookingStatusConfig[booking.status]?.label || booking.status}
                  </Badge>
                  <Badge className={paymentStatusConfig[booking.paymentStatus]?.color || ""}>
                    {paymentStatusConfig[booking.paymentStatus]?.label || booking.paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Tenant Info */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Penyewa
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{booking.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{booking.user.email}</span>
                  </div>
                  {booking.user.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{booking.user.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Informasi Kamar
                </label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipe Kamar</span>
                    <p className="font-medium">{booking.room.roomType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lantai</span>
                    <p className="font-medium">Lantai {booking.room.floor}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Periode Sewa
                </label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Check In</span>
                    <p className="font-medium">
                      {format(new Date(booking.checkInDate), "dd MMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check Out</span>
                    <p className="font-medium">
                      {booking.checkOutDate
                        ? format(new Date(booking.checkOutDate), "dd MMM yyyy", { locale: localeId })
                        : "Bulanan"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Informasi Pembayaran
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tagihan</span>
                    <span className="font-semibold">{formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sudah Dibayar</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(booking.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Sisa Tagihan</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(booking.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

