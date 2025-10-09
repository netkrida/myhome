"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Wallet, CreditCard, TrendingDown } from "lucide-react";
import type { BankAccountDTO, BalanceInfo } from "@/server/types/bank-account";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  bankAccount: BankAccountDTO;
  balance: BalanceInfo;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  onSuccess,
  bankAccount,
  balance,
}: WithdrawDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    amount: "",
    source: "SALES",
    notes: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const parseCurrency = (value: string): number => {
    return Number(value.replace(/\D/g, ""));
  };

  const handleAmountChange = (value: string) => {
    const numericValue = parseCurrency(value);
    setFormData({ ...formData, amount: numericValue.toString() });
    setErrors({ ...errors, amount: "" });
  };

  const calculateRemainingBalance = (): number => {
    const withdrawAmount = Number(formData.amount) || 0;
    return balance.availableBalance - withdrawAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    const amount = Number(formData.amount);

    if (!formData.amount || amount <= 0) {
      newErrors.amount = "Jumlah penarikan harus lebih dari 0";
    } else if (amount > balance.availableBalance) {
      newErrors.amount = `Saldo tidak mencukupi. Maksimal: ${formatCurrency(balance.availableBalance)}`;
    }

    if (!formData.source) {
      newErrors.source = "Sumber penarikan wajib dipilih";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/adminkos/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountId: bankAccount.id,
          amount,
          source: formData.source,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Pengajuan penarikan dana berhasil dibuat. Menunggu persetujuan Superadmin.");
        setFormData({
          amount: "",
          source: "SALES",
          notes: "",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        alert(data.error || "Gagal membuat pengajuan penarikan dana");
      }
    } catch (error) {
      console.error("Error submitting payout:", error);
      alert("Gagal membuat pengajuan penarikan dana");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tarik Dana</DialogTitle>
          <DialogDescription>
            Ajukan penarikan dana ke rekening bank Anda yang telah terdaftar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold text-sm">Informasi Saldo</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(balance.availableBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Penarikan Pending</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(balance.pendingPayouts)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Terakhir dihitung: {new Date(balance.lastCalculated).toLocaleString("id-ID")}
            </p>
          </div>

          <Separator />

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Sumber Penarikan *</Label>
            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SALES">Hasil Penjualan</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="OTHER">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            {errors.source && (
              <p className="text-sm text-destructive">{errors.source}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Penarikan *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                Rp
              </span>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={formData.amount ? formatCurrency(Number(formData.amount)).replace("Rp", "").trim() : ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maksimal: {formatCurrency(balance.availableBalance)}
            </p>
          </div>

          {/* Bank Account (Read-only) */}
          <div className="space-y-2">
            <Label>Rekening Tujuan</Label>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{bankAccount.bankName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {bankAccount.accountNumber} - {bankAccount.accountName}
              </p>
            </div>
          </div>

          {/* Remaining Balance */}
          {formData.amount && Number(formData.amount) > 0 && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sisa Saldo Setelah Penarikan:</span>
                <span className={`text-lg font-bold ${calculateRemainingBalance() >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatCurrency(calculateRemainingBalance())}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan jika diperlukan"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.notes.length}/500 karakter
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <TrendingDown className="mr-2 h-4 w-4" />
              Ajukan Penarikan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

