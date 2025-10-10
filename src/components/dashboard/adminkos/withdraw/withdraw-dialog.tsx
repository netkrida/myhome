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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Use new withdraw API endpoint
      const response = await fetch("/api/adminkos/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountId: bankAccount.id,
          amount,
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tarik Dana</DialogTitle>
          <DialogDescription>
            Ajukan penarikan dana dari saldo pembayaran kos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Balance Info - Simplified */}
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Saldo Tersedia
                </span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(balance.availableBalance)}
              </span>
            </div>
            {balance.pendingPayouts > 0 && (
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Pending: {formatCurrency(balance.pendingPayouts)}
              </p>
            )}
          </div>

          {/* Source - Locked to Pembayaran Kos - Compact */}
          <div className="space-y-1.5">
            <Label className="text-xs">Sumber Penarikan</Label>
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-medium text-sm">Pembayaran Kos (Sistem)</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Jumlah Penarikan *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                Rp
              </span>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={formData.amount ? formatCurrency(Number(formData.amount)).replace("Rp", "").trim() : ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount}</p>
            )}
            {!errors.amount && (
              <p className="text-xs text-muted-foreground">
                Maksimal: {formatCurrency(balance.availableBalance)}
              </p>
            )}
          </div>

          {/* Bank Account (Read-only) - Compact */}
          <div className="space-y-1.5">
            <Label className="text-xs">Rekening Tujuan</Label>
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{bankAccount.bankName}</p>
                  <p className="text-xs text-muted-foreground">
                    {bankAccount.accountNumber} - {bankAccount.accountName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Balance - Compact */}
          {formData.amount && Number(formData.amount) > 0 && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Sisa Saldo:</span>
                <span className={`text-base font-bold ${calculateRemainingBalance() >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatCurrency(calculateRemainingBalance())}
                </span>
              </div>
            </div>
          )}

          {/* Notes - Compact */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan jika diperlukan"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              maxLength={500}
              className="text-sm resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Ajukan Penarikan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

