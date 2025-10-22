'use client';

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/adminkos/bookings/booking-status-badge";

import type { BookingStatus, PaymentStatus } from "@/server/types/booking";

interface BookingSummary {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInDate: string;
  checkOutDate?: string | null;
  actualCheckInAt?: string | null;
  actualCheckOutAt?: string | null;
  checkedInByUser?: { id: string; name?: string | null };
  checkedOutByUser?: { id: string; name?: string | null };
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  room?: {
    id: string;
    roomNumber: string;
    roomType: string;
  };
}

export function CheckOutForm() {
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      toast.error("Masukkan kode booking terlebih dahulu");
      return;
    }

    try {
      setIsSearching(true);
      setBooking(null);

      const response = await fetch(`/api/receptionist/bookings/lookup?code=${encodeURIComponent(code.trim())}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Booking tidak ditemukan");
      }

      setBooking(payload.data as BookingSummary);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal mencari booking");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckOut = async () => {
    if (!booking) return;

    try {
      setIsProcessing(true);

      const response = await fetch("/api/receptionist/bookings/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal melakukan check-out");
      }

      toast.success("Check-out berhasil", {
        description: `Booking ${booking.bookingCode} telah selesai.`,
      });

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: payload.data.status,
              actualCheckOutAt: payload.data.actualCheckOutAt,
              checkedOutByUser: payload.data.checkedOutBy,
            }
          : prev
      );
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal melakukan check-out");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setBooking(null);
  };

  const isEligibleForCheckout = booking?.status === "CHECKED_IN";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cari Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-code">Kode Booking</Label>
              <div className="flex gap-2">
                <Input
                  id="booking-code"
                  placeholder="Masukkan kode booking"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={isSearching || isProcessing}
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Cari
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSearching || isProcessing}>
                  Reset
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {booking && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <BookingStatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow label="Kode Booking" value={booking.bookingCode} />
              <InfoRow label="Customer" value={booking.user?.name || booking.user?.email || "-"} />
              <InfoRow label="Kamar" value={booking.room ? `${booking.room.roomNumber} · ${booking.room.roomType}` : "-"} />
              <InfoRow
                label="Rencana Check-in"
                value={format(new Date(booking.checkInDate), "dd MMMM yyyy")}
              />
              <InfoRow
                label="Rencana Check-out"
                value={booking.checkOutDate ? format(new Date(booking.checkOutDate), "dd MMMM yyyy") : "-"}
              />
              <InfoRow
                label="Waktu Check-in"
                value={booking.actualCheckInAt ? format(new Date(booking.actualCheckInAt), "dd MMMM yyyy HH:mm") : "Belum"}
              />
              <InfoRow
                label="Petugas Check-in"
                value={booking.checkedInByUser?.name ?? booking.checkedInByUser?.id ?? "-"}
              />
              <InfoRow
                label="Waktu Check-out"
                value={booking.actualCheckOutAt ? format(new Date(booking.actualCheckOutAt), "dd MMMM yyyy HH:mm") : "Belum"}
              />
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium">Catatan:</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                Check-out hanya dapat dilakukan untuk booking dengan status <span className="font-semibold">CHECKED_IN</span>.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCheckOut} disabled={!isEligibleForCheckout || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEligibleForCheckout ? "Check-Out Sekarang" : "Belum Bisa Check-Out"}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isProcessing}>
                Cari Booking Lain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value || "-"}</p>
    </div>
  );
}
