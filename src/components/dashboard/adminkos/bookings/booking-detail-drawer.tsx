"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";
import { 
  User, 
  Building2, 
  Bed, 
  Calendar, 
  CreditCard, 
  Mail, 
  Phone,
  MapPin,
  Clock,
  Banknote,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { BookingTableItemDTO } from "@/server/types/adminkos";
import type { PaymentDTO } from "@/server/types/booking";

interface BookingDetailDrawerProps {
  booking: BookingTableItemDTO & {
    customerPhone?: string;
    customerGender?: string;
    customerInstitution?: string;
    propertyAddress?: string;
    propertyType?: string;
    roomFloor?: number;
    roomMonthlyPrice?: number;
    roomDepositAmount?: number;
    payments?: PaymentDTO[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const leaseTypeLabels: Record<string, string> = {
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  QUARTERLY: "3 Bulan",
  YEARLY: "Tahunan",
};

export function BookingDetailDrawer({ booking, open, onOpenChange }: BookingDetailDrawerProps) {
  if (!booking) return null;

  const statusTimeline = [
    { status: "UNPAID", label: "Belum Bayar", active: booking.status === "UNPAID" },
    { status: "DEPOSIT_PAID", label: "DP Dibayar", active: booking.status === "DEPOSIT_PAID" },
    { status: "CONFIRMED", label: "Terkonfirmasi", active: booking.status === "CONFIRMED" },
    { status: "CHECKED_IN", label: "Check-in", active: booking.status === "CHECKED_IN" },
    { status: "COMPLETED", label: "Selesai", active: booking.status === "COMPLETED" },
  ];

  const currentStatusIndex = statusTimeline.findIndex(s => s.active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detail Booking</SheetTitle>
          <SheetDescription>
            Informasi lengkap booking {booking.bookingCode}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.paymentStatus} />
            <Badge variant="outline">
              {leaseTypeLabels[booking.leaseType] || booking.leaseType}
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4" />
              Informasi Penyewa
            </div>
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{booking.customerEmail}</span>
              </div>
              {booking.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. HP</span>
                  <span className="font-medium">{booking.customerPhone}</span>
                </div>
              )}
              {booking.customerGender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jenis Kelamin</span>
                  <span className="font-medium capitalize">{booking.customerGender}</span>
                </div>
              )}
              {booking.customerInstitution && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Institusi</span>
                  <span className="font-medium">{booking.customerInstitution}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Booking Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4" />
              Informasi Booking
            </div>
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kode Booking</span>
                <span className="font-mono font-medium">{booking.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">
                  {format(new Date(booking.checkInDate), "dd MMMM yyyy", { locale: idLocale })}
                </span>
              </div>
              {booking.checkOutDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">
                    {format(new Date(booking.checkOutDate), "dd MMMM yyyy", { locale: idLocale })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe Sewa</span>
                <span className="font-medium">{leaseTypeLabels[booking.leaseType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="font-medium">
                  {format(new Date(booking.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Property & Room Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4" />
              Properti & Kamar
            </div>
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama Properti</span>
                <span className="font-medium">{booking.propertyName}</span>
              </div>
              {booking.propertyType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe Properti</span>
                  <span className="font-medium">{booking.propertyType}</span>
                </div>
              )}
              {booking.propertyAddress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alamat</span>
                  <span className="font-medium text-right">{booking.propertyAddress}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nomor Kamar</span>
                <span className="font-medium">{booking.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe Kamar</span>
                <span className="font-medium">{booking.roomType}</span>
              </div>
              {booking.roomFloor !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lantai</span>
                  <span className="font-medium">{booking.roomFloor}</span>
                </div>
              )}
              {booking.roomMonthlyPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga Bulanan</span>
                  <span className="font-medium">{formatCurrency(booking.roomMonthlyPrice)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4" />
              Informasi Pembayaran
            </div>
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tagihan</span>
                <span className="font-bold text-lg">{formatCurrency(booking.totalAmount)}</span>
              </div>
              {booking.depositAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-medium">{formatCurrency(booking.depositAmount)}</span>
                </div>
              )}
            </div>

            {/* Payment History */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Riwayat Pembayaran</div>
                {booking.payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border p-3 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {payment.paymentType === "DEPOSIT" ? "Deposit" : "Pelunasan"}
                      </span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah</span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                    {payment.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Metode</span>
                        <span className="font-medium capitalize">{payment.paymentMethod}</span>
                      </div>
                    )}
                    {payment.transactionTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Waktu</span>
                        <span className="font-medium">
                          {format(new Date(payment.transactionTime), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Status Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4" />
              Timeline Status
            </div>
            <div className="space-y-2">
              {statusTimeline.map((item, index) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    index <= currentStatusIndex 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : "border-muted bg-background text-muted-foreground"
                  }`}>
                    {index < currentStatusIndex ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : index === currentStatusIndex ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    index <= currentStatusIndex ? "font-medium" : "text-muted-foreground"
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

