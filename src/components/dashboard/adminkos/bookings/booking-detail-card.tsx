"use client";

import * as React from "react";
import { X, Mail, Phone, MapPin, Calendar, Clock, CreditCard, User, Home, Bed, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface BookingDetailCardProps {
  booking: any; // We'll type this properly
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500 text-white",
  CONFIRMED: "bg-blue-500 text-white",
  CHECKED_IN: "bg-green-500 text-white",
  CHECKED_OUT: "bg-gray-500 text-white",
  CANCELLED: "bg-red-500 text-white",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  CHECKED_IN: "Check-in",
  CHECKED_OUT: "Check-out",
  CANCELLED: "Dibatalkan",
};

const statusIcons: Record<string, any> = {
  PENDING: AlertCircle,
  CONFIRMED: CheckCircle2,
  CHECKED_IN: CheckCircle2,
  CHECKED_OUT: CheckCircle2,
  CANCELLED: XCircle,
};

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kadaluarsa",
};

export function BookingDetailCard({ booking, onClose }: BookingDetailCardProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate duration
  const calculateDuration = () => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const StatusIcon = statusIcons[booking.status] || AlertCircle;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold">Detail Booking</h2>
            <p className="text-sm text-muted-foreground">Kode: {booking.bookingCode}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={statusColors[booking.status]}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusLabels[booking.status]}
              </Badge>
              {booking.payments && booking.payments.length > 0 && (
                <Badge variant="outline" className={paymentStatusColors[booking.payments[0].status]}>
                  {paymentStatusLabels[booking.payments[0].status]}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Dibuat: {format(new Date(booking.createdAt), "d MMM yyyy, HH:mm", { locale: idLocale })}
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informasi Penyewa
            </h4>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage src={booking.user?.image || undefined} alt={booking.user?.name} />
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                  {getInitials(booking.user?.name || "User")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <div className="font-semibold text-lg">{booking.user?.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />
                    {booking.user?.email}
                  </div>
                  {booking.user?.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Phone className="h-3 w-3" />
                      {booking.user?.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Property & Room Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informasi Properti & Kamar
            </h4>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">{booking.property?.name}</div>
                  {booking.property?.fullAddress && (
                    <div className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5" />
                      {booking.property.fullAddress}
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <Bed className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">Kamar {booking.room?.roomNumber}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Tipe: {booking.room?.roomType || "-"}
                  </div>
                  {booking.room?.floor && (
                    <div className="text-sm text-muted-foreground">
                      Lantai: {booking.room.floor}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Detail Booking
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Check-in</span>
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {format(new Date(booking.checkInDate), "d MMMM yyyy", { locale: idLocale })}
                </div>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Check-out</span>
                </div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {format(new Date(booking.checkOutDate), "d MMMM yyyy", { locale: idLocale })}
                </div>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Durasi</span>
                </div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {calculateDuration()} Hari
                </div>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Biaya</span>
                </div>
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  {formatCurrency(booking.totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {booking.payments && booking.payments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informasi Pembayaran
                </h4>
                {booking.payments.map((payment: any) => (
                  <div key={payment.id} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Order ID: {payment.orderId}</div>
                      <Badge className={paymentStatusColors[payment.status]}>
                        {paymentStatusLabels[payment.status]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Metode:</span>{" "}
                        <span className="font-medium">{payment.paymentMethod || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Jumlah:</span>{" "}
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                      {payment.paidAt && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Dibayar:</span>{" "}
                          <span className="font-medium">
                            {format(new Date(payment.paidAt), "d MMM yyyy, HH:mm", { locale: idLocale })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Notes */}
          {booking.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Catatan
                </h4>
                <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                  {booking.notes}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

