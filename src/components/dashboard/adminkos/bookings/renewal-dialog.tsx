"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCcw } from "lucide-react";
import { LeaseType } from "@/server/types/booking";
import type { BookingTableItemDTO } from "@/server/types/adminkos";

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

interface RenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  booking: BookingTableItemDTO | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function RenewalDialog({
  open,
  onOpenChange,
  onSuccess,
  booking
}: RenewalDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [accounts, setAccounts] = React.useState<AccountOption[]>([]);
  const [accountId, setAccountId] = React.useState("");
  const [leaseType, setLeaseType] = React.useState<LeaseType>(LeaseType.MONTHLY);
  const [depositOption, setDepositOption] = React.useState<"deposit" | "full">("full");
  const [useOriginalDiscount, setUseOriginalDiscount] = React.useState(true);

  // Fetch accounts (exclude system accounts and archived accounts, only INCOME type)
  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/adminkos/ledger/accounts?type=INCOME");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAccounts(data.data.filter((a: AccountOption & { isSystem?: boolean; isArchived?: boolean }) => !a.isSystem && !a.isArchived));
        } else if (data.success && Array.isArray(data.data.accounts)) {
          setAccounts(data.data.accounts.filter((a: AccountOption & { isSystem?: boolean; isArchived?: boolean }) => !a.isSystem && !a.isArchived));
        }
      } catch (err) {
        console.error("Error fetching accounts:", err);
      }
    };
    if (open) {
      fetchAccounts();
      // Reset form when dialog opens
      setLeaseType(booking?.leaseType as LeaseType || LeaseType.MONTHLY);
      setDepositOption("full");
      setAccountId("");
      setUseOriginalDiscount(booking?.discountAmount ? true : false);
    }
  }, [open, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking || !accountId) {
      alert("Mohon pilih akun transaksi");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/adminkos/bookings/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          leaseType,
          depositOption,
          accountId,
          // Carry over discount from original booking if selected
          discountAmount: useOriginalDiscount && booking.discountAmount ? booking.discountAmount : undefined,
          discountNote: useOriginalDiscount && booking.discountNote ? `${booking.discountNote} (perpanjangan)` : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Gagal memperpanjang booking");
      }

      alert(`Berhasil! Booking perpanjangan ${data.data.bookingCode} berhasil dibuat`);
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error("Error renewing booking:", error);
      alert(error instanceof Error ? error.message : "Gagal memperpanjang booking");
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Perpanjangan Sewa
          </DialogTitle>
          <DialogDescription>
            Buat booking perpanjangan untuk penyewa yang sudah ada. Status akan otomatis CHECKED_IN.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Booking Info */}
          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Booking Saat Ini:</span>
                <p className="font-mono font-medium">{booking.bookingCode}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Penyewa:</span>
                <p className="font-medium">{booking.customerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kamar:</span>
                <p className="font-medium">{booking.roomNumber} - {booking.roomType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sisa Waktu:</span>
                <p className="font-medium text-orange-600">{booking.remainingDays} hari lagi</p>
              </div>
              <div>
                <span className="text-muted-foreground">Harga Asli:</span>
                <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
              </div>
              {booking.discountAmount && booking.discountAmount > 0 && (
                <>
                  <div>
                    <span className="text-muted-foreground">Potongan:</span>
                    <p className="font-medium text-green-600">-{formatCurrency(booking.discountAmount)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Harga Setelah Diskon:</span>
                    <p className="font-bold text-primary">{formatCurrency(booking.finalAmount ?? (booking.totalAmount - booking.discountAmount))}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Discount carry over option */}
          {booking.discountAmount && booking.discountAmount > 0 && (
            <div className="flex items-center space-x-2 border rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
              <input
                type="checkbox"
                id="useOriginalDiscount"
                checked={useOriginalDiscount}
                onChange={(e) => setUseOriginalDiscount(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="useOriginalDiscount" className="text-sm">
                Gunakan potongan harga yang sama ({formatCurrency(booking.discountAmount)})
                {booking.discountNote && <span className="text-muted-foreground"> - {booking.discountNote}</span>}
              </label>
            </div>
          )}

          {/* Akun Transaksi */}
          <div className="space-y-2">
            <Label htmlFor="account">Akun Transaksi *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Pilih akun transaksi" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type === "INCOME" ? "Pemasukan" : acc.type === "EXPENSE" ? "Pengeluaran" : "Lainnya"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lease Type */}
          <div className="space-y-2">
            <Label htmlFor="leaseType">Tipe Sewa *</Label>
            <Select value={leaseType} onValueChange={(value) => setLeaseType(value as LeaseType)}>
              <SelectTrigger id="leaseType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeaseType.DAILY}>Harian</SelectItem>
                <SelectItem value={LeaseType.WEEKLY}>Mingguan</SelectItem>
                <SelectItem value={LeaseType.MONTHLY}>Bulanan</SelectItem>
                <SelectItem value={LeaseType.QUARTERLY}>3 Bulan</SelectItem>
                <SelectItem value={LeaseType.YEARLY}>Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deposit Option */}
          <div className="space-y-2">
            <Label htmlFor="depositOption">Opsi Pembayaran *</Label>
            <Select value={depositOption} onValueChange={(value) => setDepositOption(value as "deposit" | "full")}>
              <SelectTrigger id="depositOption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Bayar Penuh</SelectItem>
                <SelectItem value="deposit">Bayar Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-medium text-blue-800 dark:text-blue-200">Catatan:</p>
            <p className="text-blue-700 dark:text-blue-300">
              Perpanjangan akan dimulai dari tanggal checkout booking saat ini. 
              Booking baru akan dibuat dengan status terkonfirmasi.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Perpanjang Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
