"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import type { RecentBookingsDTO, BookingTableItemDTO } from "@/server/types/adminkos";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { BookingStatus, PaymentStatus } from "@/server/types/booking";

interface RecentBookingsTableProps {
  data: RecentBookingsDTO;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  onFilterChange?: (filter: { status?: string; paymentStatus?: string }) => void;
}

// Status badge colors
const bookingStatusColors: Record<string, string> = {
  UNPAID: "bg-gray-100 text-gray-800 border-gray-300",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800 border-indigo-300",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
  CHECKED_IN: "bg-emerald-100 text-emerald-800 border-emerald-300",
  COMPLETED: "bg-slate-100 text-slate-800 border-slate-300",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-300",
  EXPIRED: "bg-zinc-100 text-zinc-800 border-zinc-300",
};

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  SUCCESS: "bg-emerald-100 text-emerald-800 border-emerald-300",
  FAILED: "bg-rose-100 text-rose-800 border-rose-300",
  EXPIRED: "bg-zinc-100 text-zinc-800 border-zinc-300",
  REFUNDED: "bg-cyan-100 text-cyan-800 border-cyan-300",
};

export function RecentBookingsTable({
  data,
  onPageChange,
  onSearch,
  onFilterChange,
}: RecentBookingsTableProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState<string>("all");

  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchValue(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  const handleStatusFilter = React.useCallback(
    (value: string) => {
      setStatusFilter(value);
      onFilterChange?.({
        status: value === "all" ? undefined : value,
        paymentStatus: paymentStatusFilter === "all" ? undefined : paymentStatusFilter,
      });
    },
    [paymentStatusFilter, onFilterChange]
  );

  const handlePaymentStatusFilter = React.useCallback(
    (value: string) => {
      setPaymentStatusFilter(value);
      onFilterChange?.({
        status: statusFilter === "all" ? undefined : statusFilter,
        paymentStatus: value === "all" ? undefined : value,
      });
    },
    [statusFilter, onFilterChange]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Terbaru</CardTitle>
        <CardDescription>Daftar booking dari semua properti Anda</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari booking code, customer, kamar..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="DEPOSIT_PAID">Deposit Paid</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatusFilter} onValueChange={handlePaymentStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Payment</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Booking Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Properti</TableHead>
                <TableHead>Kamar</TableHead>
                <TableHead>Tipe Sewa</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Tidak ada booking ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                data.bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(booking.createdAt), "dd MMM yyyy", { locale: idLocale })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{booking.bookingCode}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.customerName}</span>
                        <span className="text-xs text-muted-foreground">{booking.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{booking.propertyName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.roomNumber}</span>
                        <span className="text-xs text-muted-foreground">{booking.roomType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.leaseType}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(booking.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={paymentStatusColors[booking.paymentStatus] || ""}
                      >
                        {booking.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={bookingStatusColors[booking.status] || ""}
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {data.bookings.length} dari {data.pagination.total} booking
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <div className="text-sm">
              Halaman {data.pagination.page} dari {data.pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(data.pagination.page + 1)}
              disabled={data.pagination.page === data.pagination.totalPages}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

