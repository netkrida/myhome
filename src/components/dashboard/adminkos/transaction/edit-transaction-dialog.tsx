"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { LedgerEntryDTO, LedgerAccountDTO } from "@/server/types/ledger";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LedgerEntryDTO | null;
  accounts: LedgerAccountDTO[];
  onSubmit: (entryId: string, data: {
    accountId?: string;
    direction?: "IN" | "OUT";
    amount?: number;
    date?: Date;
    note?: string;
  }) => Promise<void>;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  entry,
  accounts,
  onSubmit,
}: EditTransactionDialogProps) {
  const [formData, setFormData] = useState({
    accountId: "",
    direction: "IN" as "IN" | "OUT",
    amount: "",
    date: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when entry changes
  useEffect(() => {
    if (entry && open) {
      setFormData({
        accountId: entry.accountId,
        direction: entry.direction,
        amount: entry.amount.toString(),
        date: new Date(entry.date).toISOString().split('T')[0]!,
        note: entry.note || "",
      });
      setErrors({});
    }
  }, [entry, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId) {
      newErrors.accountId = "Akun harus dipilih";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Jumlah harus lebih dari 0";
    }

    if (!formData.date) {
      newErrors.date = "Tanggal harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entry || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {};
      
      // Only include changed fields
      if (formData.accountId !== entry.accountId) {
        updateData.accountId = formData.accountId;
      }
      if (formData.direction !== entry.direction) {
        updateData.direction = formData.direction;
      }
      if (parseFloat(formData.amount) !== entry.amount) {
        updateData.amount = parseFloat(formData.amount);
      }
      const newDate = new Date(formData.date);
      const oldDate = new Date(entry.date);
      if (newDate.toISOString().split('T')[0] !== oldDate.toISOString().split('T')[0]) {
        updateData.date = newDate;
      }
      if (formData.note !== (entry.note || "")) {
        updateData.note = formData.note;
      }

      await onSubmit(entry.id, updateData);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      const errorMessage = error?.message || "Gagal mengupdate transaksi";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Filter accounts based on direction
  const compatibleAccounts = accounts.filter(account => {
    if (formData.direction === "IN") {
      return account.type === "INCOME" || account.type === "OTHER";
    } else {
      return account.type === "EXPENSE" || account.type === "OTHER";
    }
  });

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Transaksi Manual</DialogTitle>
          <DialogDescription>
            Ubah detail transaksi manual. Hanya transaksi manual yang bisa diedit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Direction */}
          <div className="space-y-2">
            <Label htmlFor="direction">Arah Transaksi</Label>
            <Select 
              value={formData.direction} 
              onValueChange={(value) => handleInputChange("direction", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Uang Masuk (IN)</span>
                  </div>
                </SelectItem>
                <SelectItem value="OUT">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Uang Keluar (OUT)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="accountId">Akun/Kategori</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => handleInputChange("accountId", value)}
            >
              <SelectTrigger className={errors.accountId ? "border-red-500" : ""}>
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {compatibleAccounts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Tidak ada akun yang kompatibel
                  </div>
                ) : (
                  compatibleAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {account.type === "INCOME" ? "Pemasukan" : 
                           account.type === "EXPENSE" ? "Pengeluaran" : "Lainnya"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="Masukkan jumlah"
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className={errors.date ? "border-red-500" : ""}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
              placeholder="Tambahkan catatan..."
              rows={3}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

