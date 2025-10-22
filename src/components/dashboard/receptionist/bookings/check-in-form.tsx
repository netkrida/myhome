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

export function CheckInForm() {
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

  const handleCheckIn = async () => {
    if (!booking) return;

    try {
      setIsProcessing(true);

      const response = await fetch("/api/receptionist/bookings/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal melakukan check-in");
      }

      toast.success("Check-in berhasil", {
        description: `Booking ${booking.bookingCode} sudah check-in.`,
      });

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: payload.data.status,
              actualCheckInAt: payload.data.actualCheckInAt,
              checkedInByUser: payload.data.checkedInBy,
            }
          : prev
      );
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal melakukan check-in");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setBooking(null);
  };

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
                  placeholder="Misal: BKABC123"
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
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={isProcessing || booking.status === "CHECKED_IN" || booking.status === "COMPLETED"}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {booking.status === "CHECKED_IN" ? "Sudah Check-In" : "Check-In Sekarang"}
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
