"use client";

import { Badge } from "@/components/ui/badge";
import { BookingStatus, PaymentStatus } from "@/server/types/booking";
import { cn } from "@/lib/utils";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const bookingStatusConfig: Record<BookingStatus, { label: string; className: string }> = {
  UNPAID: {
    label: "Belum Bayar",
    className: "bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-100",
  },
  DEPOSIT_PAID: {
    label: "DP Dibayar",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-100",
  },
  CONFIRMED: {
    label: "Terkonfirmasi",
    className: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100",
  },
  CHECKED_IN: {
    label: "Check-in",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
  },
  COMPLETED: {
    label: "Selesai",
    className: "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-100",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-100",
  },
  EXPIRED: {
    label: "Kadaluarsa",
    className: "bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-100",
  },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100",
  },
  SUCCESS: {
    label: "Berhasil",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
  },
  FAILED: {
    label: "Gagal",
    className: "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-100",
  },
  EXPIRED: {
    label: "Kadaluarsa",
    className: "bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-100",
  },
  REFUNDED: {
    label: "Dikembalikan",
    className: "bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-100",
  },
};

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = bookingStatusConfig[status];
  
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = paymentStatusConfig[status];
  
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

