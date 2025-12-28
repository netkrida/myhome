"use client";

import * as React from "react";
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
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";
import { Eye, ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { BookingTableItemDTO } from "@/server/types/adminkos";

interface BookingsTableProps {
  bookings: BookingTableItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onViewDetails: (booking: BookingTableItemDTO) => void;
  onCheckIn?: (booking: BookingTableItemDTO) => void;
  onCheckOut?: (booking: BookingTableItemDTO) => void;
  onRenewal?: (booking: BookingTableItemDTO) => void;
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

// Get remaining days badge variant
function getRemainingDaysBadge(remainingDays: number, status: string) {
  if (status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED") {
    return null;
  }
  
  if (remainingDays <= 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Lewat
      </Badge>
    );
  }
  
  if (remainingDays <= 3) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {remainingDays} hari
      </Badge>
    );
  }
  
  if (remainingDays <= 7) {
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {remainingDays} hari
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      {remainingDays} hari
    </Badge>
  );
}

export function BookingsTable({ 
  bookings, 
  pagination, 
  onPageChange, 
  onViewDetails,
  onCheckIn,
  onCheckOut,
  onRenewal,
}: BookingsTableProps) {
  const [showOverdueOnly, setShowOverdueOnly] = React.useState(false);
  const startIndex = (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  // Check if booking can be checked in (CONFIRMED status)
  const canCheckIn = (booking: BookingTableItemDTO) => {
    return booking.status === "CONFIRMED" && !booking.actualCheckInAt;
  };

  // Check if booking can be checked out (CHECKED_IN status)
  const canCheckOut = (booking: BookingTableItemDTO) => {
    return booking.status === "CHECKED_IN" && !booking.actualCheckOutAt;
  };

  // Check if booking can be renewed (CHECKED_IN status)
  const canRenew = (booking: BookingTableItemDTO) => {
    return booking.status === "CHECKED_IN";
  };

  // Filter bookings jika showOverdueOnly aktif
  const filteredBookings = showOverdueOnly
    ? bookings.filter(
        (b) => b.remainingDays <= 0 && !["COMPLETED", "CANCELLED", "EXPIRED"].includes(b.status)
      )
    : bookings;

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOverdueOnly}
            onChange={() => setShowOverdueOnly((v) => !v)}
            className="accent-red-600"
          />
          <span className="text-sm">Tampilkan hanya yang sisa waktu <span className="font-semibold text-red-600">lewat</span></span>
        </label>
      </div>
      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">No</TableHead>
              <TableHead className="w-[120px]">Kode Booking</TableHead>
              <TableHead>Penyewa</TableHead>
              <TableHead>Properti & Kamar</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead className="w-[100px]">Tipe Sewa</TableHead>
              <TableHead className="w-[100px]">Sisa Waktu</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[120px]">Status Bayar</TableHead>
              <TableHead className="w-[120px]">Status Booking</TableHead>
              <TableHead className="w-[150px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                  Tidak ada data booking
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking, index) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {booking.bookingCode}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customerEmail}
                      </div>
                      {booking.customerPhone && (
                        <div className="text-xs text-muted-foreground">
                          {booking.customerPhone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{booking.propertyName}</div>
                      <div className="text-xs text-muted-foreground">
                        Kamar {booking.roomNumber} • {booking.roomType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {format(new Date(booking.checkInDate), "dd/MM/yyyy", { locale: idLocale })}
                      </div>
                      {booking.actualCheckInAt && (
                        <div className="text-xs text-green-600">
                          ✓ {format(new Date(booking.actualCheckInAt), "HH:mm", { locale: idLocale })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {booking.checkOutDate ? (
                        <>
                          <div className="text-sm">
                            {format(new Date(booking.checkOutDate), "dd/MM/yyyy", { locale: idLocale })}
                          </div>
                          {booking.actualCheckOutAt && (
                            <div className="text-xs text-blue-600">
                              ✓ {format(new Date(booking.actualCheckOutAt), "HH:mm", { locale: idLocale })}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {leaseTypeLabels[booking.leaseType] || booking.leaseType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {booking.leaseDuration} hari
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRemainingDaysBadge(booking.remainingDays, booking.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">
                        {formatCurrency(booking.finalAmount ?? booking.totalAmount)}
                      </div>
                      {booking.discountAmount && booking.discountAmount > 0 && (
                        <div className="text-xs text-green-600">
                          -{formatCurrency(booking.discountAmount)}
                        </div>
                      )}
                      {booking.depositAmount && (
                        <div className="text-xs text-muted-foreground">
                          DP: {formatCurrency(booking.depositAmount)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={booking.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(booking)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canCheckIn(booking) && onCheckIn && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCheckIn(booking)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Check-in"
                        >
                          In
                        </Button>
                      )}
                      {canCheckOut(booking) && onCheckOut && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCheckOut(booking)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Check-out"
                        >
                          Out
                        </Button>
                      )}
                      {canRenew(booking) && onRenewal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRenewal(booking)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Perpanjang"
                        >
                          +
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {startIndex} - {endIndex} dari {pagination.total} booking
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

