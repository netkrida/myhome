"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    bookingCode: string;
    user?: {
      name?: string;
    };
    room?: {
      roomNumber: string;
      roomType: string;
    };
    checkInDate: Date;
  };
  onSuccess?: () => void;
}

/**
 * Check-in Dialog Component
 * Confirms and processes booking check-in
 */
export function CheckInDialog({
  open,
  onOpenChange,
  booking,
  onSuccess
}: CheckInDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      setLoading(true);

      if (!booking.id) {
        toast.error("Error", {
          description: "Booking ID tidak ditemukan. Silakan refresh halaman.",
        });
        return;
      }

      const response = await fetch("/api/receptionist/bookings/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : (data.error?.message || "Failed to check-in booking");
        throw new Error(errorMessage);
      }

      toast.success("Check-in berhasil!", {
        description: `Booking ${booking.bookingCode} telah di-check-in.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error checking in booking:", error);
      toast.error("Gagal check-in", {
        description: error.message || "Terjadi kesalahan saat check-in booking.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Konfirmasi Check-in
          </DialogTitle>
          <DialogDescription>
            Pastikan data booking sudah benar sebelum melakukan check-in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kode Booking:</span>
              <span className="font-medium">{booking.bookingCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{booking.user?.name || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kamar:</span>
              <span className="font-medium">
                {booking.room?.roomNumber} - {booking.room?.roomType}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tanggal Check-in:</span>
              <span className="font-medium">
                {new Date(booking.checkInDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Catatan:</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Setelah check-in, status booking akan berubah menjadi "Checked In" dan customer dapat menempati kamar.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Memproses..." : "Konfirmasi Check-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

