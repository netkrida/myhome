'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/adminkos/bookings/booking-status-badge";

import type { BookingStatus, PaymentStatus } from "@/server/types/booking";

interface BookingListItem {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInDate: string;
  checkOutDate?: string | null;
  actualCheckInAt?: string | null;
  actualCheckOutAt?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  };
  room?: {
    roomNumber: string;
    roomType: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    bookings: BookingListItem[];
    pagination: PaginationInfo;
  };
  error?: string;
}

interface ReceptionistBookingsListProps {
  status?: BookingStatus;
  title?: string;
  description?: string;
  showCheckInAction?: boolean;
  showCheckOutAction?: boolean;
}

export function ReceptionistBookingsList({
  status,
  title,
  description,
  showCheckInAction = false,
  showCheckOutAction = false,
}: ReceptionistBookingsListProps) {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("limit", "100");
    return params.toString();
  }, [status]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/receptionist/bookings${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
      });
      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error || "Gagal memuat daftar booking");
      }

      setBookings(data.data.bookings);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal memuat daftar booking");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleCheckIn = useCallback(
    async (bookingId: string) => {
      try {
        setProcessingId(bookingId);
        const response = await fetch("/api/receptionist/bookings/checkin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId }),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Gagal melakukan check-in");
        }

        toast.success("Tamu berhasil check-in");
        await fetchBookings();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Gagal melakukan check-in");
      } finally {
        setProcessingId(null);
      }
    },
    [fetchBookings]
  );

  const handleCheckOut = useCallback(
    async (bookingId: string) => {
      try {
        setProcessingId(bookingId);
        const response = await fetch("/api/receptionist/bookings/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId }),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Gagal melakukan check-out");
        }

        toast.success("Tamu berhasil check-out");
        await fetchBookings();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Gagal melakukan check-out");
      } finally {
        setProcessingId(null);
      }
    },
    [fetchBookings]
  );

  const canCheckIn = useCallback((booking: BookingListItem) => {
    return booking.status === "CONFIRMED" || booking.status === "DEPOSIT_PAID";
  }, []);

  const canCheckOut = useCallback((booking: BookingListItem) => {
    return booking.status === "CHECKED_IN";
  }, []);

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy");
  }, []);

  const formatDateTime = useCallback((value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy HH:mm");
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{title ?? "Daftar Booking"}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {pagination && (
            <p className="text-sm text-muted-foreground">
              Total booking: {pagination.total} · Halaman {pagination.page} dari {pagination.totalPages}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchBookings()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Segarkan
          </Button>
          {status && <Badge variant="secondary">Filter: {status.replace(/_/g, " ")}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat data booking...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Belum ada booking untuk ditampilkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Status</TableHead>
                  {(showCheckInAction || showCheckOutAction) && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="align-top">
                        <div className="font-semibold uppercase tracking-wide">{booking.bookingCode}</div>
                        <p className="text-xs text-muted-foreground">Check-in: {formatDateTime(booking.actualCheckInAt)}</p>
                        <p className="text-xs text-muted-foreground">Check-out: {formatDateTime(booking.actualCheckOutAt)}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium">{booking.user?.name ?? "-"}</div>
                        <p className="text-xs text-muted-foreground">{booking.user?.email ?? "Email tidak tersedia"}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium">{booking.room ? booking.room.roomNumber : "-"}</div>
                        <p className="text-xs text-muted-foreground">{booking.room ? booking.room.roomType : "-"}</p>
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        <div>Rencana Check-in: {formatDate(booking.checkInDate)}</div>
                        <div>Rencana Check-out: {formatDate(booking.checkOutDate)}</div>
                      </TableCell>
                      <TableCell className="align-top space-y-2">
                        <BookingStatusBadge status={booking.status} />
                        <PaymentStatusBadge status={booking.paymentStatus} />
                      </TableCell>
                      {(showCheckInAction || showCheckOutAction) && (
                        <TableCell className="align-top text-right">
                          <div className="flex justify-end gap-2">
                            {showCheckInAction && (
                              canCheckIn(booking) ? (
                                <Button
                                  size="sm"
                                  onClick={() => void handleCheckIn(booking.id)}
                                  disabled={processingId === booking.id}
                                >
                                  {processingId === booking.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Check-in
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" disabled>
                                  Belum siap
                                </Button>
                              )
                            )}
                            {showCheckOutAction && (
                              canCheckOut(booking) ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => void handleCheckOut(booking.id)}
                                  disabled={processingId === booking.id}
                                >
                                  {processingId === booking.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Check-out
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" disabled>
                                  Belum siap
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
