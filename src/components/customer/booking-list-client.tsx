"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Calendar,
  Home,
  MapPin,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  BedDouble,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Booking {
  id: string;
  bookingCode: string;
  checkInDate?: string | Date | null;
  checkOutDate?: string | Date | null;
  leaseType?: string;
  totalAmount: number;
  depositAmount?: number;
  paymentStatus?: string;
  status: string;
  createdAt?: string | Date;
  propertyName?: string | null;
  roomType?: string | null;
  roomNumber?: string;
}

interface BookingListClientProps {
  bookings: Booking[];
}

// Status yang memerlukan tindakan
const ACTION_REQUIRED_STATUSES = ["UNPAID", "PENDING", "EXPIRED"];

// Status aktif
const ACTIVE_STATUSES = ["DEPOSIT_PAID", "CONFIRMED", "CHECKED_IN"];

export function BookingListClient({ bookings }: BookingListClientProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      UNPAID: {
        label: "Belum Dibayar",
        className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        icon: AlertCircle,
      },
      PENDING: {
        label: "Menunggu",
        className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        icon: Clock,
      },
      EXPIRED: {
        label: "Kadaluarsa",
        className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
        icon: XCircle,
      },
      DEPOSIT_PAID: {
        label: "DP Dibayar",
        className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
        icon: CheckCircle2,
      },
      CONFIRMED: {
        label: "Terkonfirmasi",
        className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
        icon: CheckCircle2,
      },
      CHECKED_IN: {
        label: "Check-in",
        className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
        icon: CheckCircle2,
      },
      COMPLETED: {
        label: "Selesai",
        className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        icon: CheckCircle2,
      },
      CANCELLED: {
        label: "Dibatalkan",
        className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-slate-100 text-slate-700 border-slate-200",
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <Badge className={`gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateValue?: string | Date | null) => {
    if (!dateValue) return "-";
    try {
      const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
      return format(date, "dd MMM yyyy", { locale: localeId });
    } catch {
      return "-";
    }
  };

  // Split bookings into sections
  const actionRequiredBookings = bookings.filter((b) =>
    ACTION_REQUIRED_STATUSES.includes(b.status)
  );
  const activeBookings = bookings.filter((b) =>
    ACTIVE_STATUSES.includes(b.status)
  );

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Section */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Kode Booking</p>
                <p className="font-mono text-sm font-bold">{booking.bookingCode}</p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{booking.propertyName || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BedDouble className="h-4 w-4" />
                <span>
                  {booking.roomType} - Kamar {booking.roomNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.checkInDate)}</span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end gap-3 sm:min-w-[180px]">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Pembayaran</p>
              <Price amount={booking.totalAmount} className="text-lg" />
            </div>
            <Button
              onClick={() => router.push(`/dashboard/customer/booking/${booking.id}`)}
              className="w-full rounded-full sm:w-auto"
              size="sm"
            >
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Booking Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kelola dan pantau semua booking properti Anda
        </p>
      </div>

      {/* Perlu Tindakan Section */}
      <Section
        title="Perlu Tindakan"
        description="Booking yang memerlukan pembayaran atau konfirmasi"
      >
        {actionRequiredBookings.length === 0 ? (
          <EmptyState
            title="Tidak ada booking yang perlu ditindaklanjuti"
            description="Semua booking Anda sudah diproses"
            variant="default"
          />
        ) : (
          <div className="grid gap-3">
            {actionRequiredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </Section>

      {/* Aktif Section */}
      <Section
        title="Booking Aktif"
        description="Booking yang sedang berjalan atau terkonfirmasi"
      >
        {activeBookings.length === 0 ? (
          <EmptyState
            title="Belum ada booking aktif"
            description="Booking yang sudah dikonfirmasi akan muncul di sini"
            variant="default"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </Section>

      {/* Empty State - No bookings at all */}
      {bookings.length === 0 && (
        <EmptyState
          title="Belum ada booking"
          description="Anda belum memiliki riwayat booking. Mulai cari properti impian Anda sekarang!"
          action={{
            label: "Cari Properti",
            onClick: () => router.push("/"),
          }}
        />
      )}
    </div>
  );
}

