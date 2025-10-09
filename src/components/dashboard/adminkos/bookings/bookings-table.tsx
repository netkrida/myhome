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
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";
import { Eye, ChevronLeft, ChevronRight, FileDown, Send } from "lucide-react";
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

export function BookingsTable({ 
  bookings, 
  pagination, 
  onPageChange, 
  onViewDetails 
}: BookingsTableProps) {
  const startIndex = (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Kode Booking</TableHead>
              <TableHead>Penyewa</TableHead>
              <TableHead>Properti & Kamar</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead className="w-[100px]">Tipe Sewa</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[130px]">Status Bayar</TableHead>
              <TableHead className="w-[130px]">Status Booking</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Tidak ada data booking
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">
                    {booking.bookingCode}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customerEmail}
                      </div>
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
                        {format(new Date(booking.checkInDate), "dd MMM yyyy", { locale: idLocale })}
                      </div>
                      {booking.checkOutDate && (
                        <div className="text-xs text-muted-foreground">
                          s/d {format(new Date(booking.checkOutDate), "dd MMM", { locale: idLocale })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {leaseTypeLabels[booking.leaseType] || booking.leaseType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">
                        {formatCurrency(booking.totalAmount)}
                      </div>
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(booking)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

