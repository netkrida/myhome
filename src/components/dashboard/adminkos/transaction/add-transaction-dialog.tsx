"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, TrendingDown, AlertCircle, Calendar } from "lucide-react";
import type { CreateLedgerEntryDTO, LedgerAccountDTO, LedgerDirection } from "@/server/types/ledger";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLedgerEntryDTO) => Promise<void>;
  accounts: LedgerAccountDTO[];
  isLoading?: boolean;
}

export function AddTransactionDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  accounts,
  isLoading 
}: AddTransactionDialogProps) {
  const [formData, setFormData] = useState({
    accountId: "",
    direction: "IN" as const,
    amount: 0,
    date: new Date().toISOString().split('T')[0]!,
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter accounts based on direction
  const getCompatibleAccounts = (direction: LedgerDirection) => {
    return accounts.filter(account => {
      if (direction === "IN") {
        return account.type === "INCOME" || account.type === "OTHER";
      } else {
        return account.type === "EXPENSE" || account.type === "OTHER";
      }
    }).filter(account => !account.isArchived);
  };

  const compatibleAccounts = getCompatibleAccounts(formData.direction);
  const selectedAccount = accounts.find(acc => acc.id === formData.accountId);

  // Reset account selection when direction changes if not compatible
  useEffect(() => {
    if (formData.accountId && selectedAccount) {
      const isCompatible = compatibleAccounts.some(acc => acc.id === formData.accountId);
      if (!isCompatible) {
        setFormData(prev => ({ ...prev, accountId: "" }));
      }
    }
  }, [formData.direction, formData.accountId, selectedAccount, compatibleAccounts]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId) {
      newErrors.accountId = "Akun wajib dipilih";
    }

    if (!formData.direction) {
      newErrors.direction = "Arah transaksi wajib dipilih";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Jumlah harus lebih dari 0";
    } else if (formData.amount > 999999999999) {
      newErrors.amount = "Jumlah terlalu besar";
    }

    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        newErrors.date = "Tanggal tidak boleh di masa depan";
      }
    }

    if (formData.note && formData.note.length > 500) {
      newErrors.note = "Catatan maksimal 500 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        accountId: formData.accountId,
        direction: formData.direction,
        amount: formData.amount,
        date: formData.date ? new Date(formData.date) : undefined,
        note: formData.note?.trim() || undefined,
        refType: "MANUAL",
      });

      // Reset form on success
      setFormData({
        accountId: "",
        direction: "IN",
        amount: 0,
        date: new Date().toISOString().split('T')[0]!,
        note: "",
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Manual</DialogTitle>
          <DialogDescription>
            Catat transaksi keuangan yang tidak tercatat otomatis dari sistem.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Direction Selection */}
          <div className="space-y-3">
            <Label htmlFor="direction">Arah Transaksi *</Label>
            <Select 
              value={formData.direction} 
              onValueChange={(value) => handleInputChange("direction", value)}
            >
              <SelectTrigger className={errors.direction ? "border-destructive" : ""}>
                <SelectValue placeholder="Pilih arah transaksi" />
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
            {errors.direction && (
              <p className="text-sm text-destructive">{errors.direction}</p>
            )}
          </div>

          {/* Account Selection */}
          <div className="space-y-3">
            <Label htmlFor="accountId">Akun/Kategori *</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => handleInputChange("accountId", value)}
            >
              <SelectTrigger className={errors.accountId ? "border-destructive" : ""}>
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
                        <Badge variant="outline" className="ml-2 text-xs">
                          {account.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-destructive">{errors.accountId}</p>
            )}
            
            {formData.direction && compatibleAccounts.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tidak ada akun yang kompatibel dengan arah transaksi {formData.direction === "IN" ? "masuk" : "keluar"}. 
                  Buat akun baru dengan tipe yang sesuai terlebih dahulu.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={formData.amount || ""}
              onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
              className={errors.amount ? "border-destructive" : ""}
              min="0"
              step="1000"
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
            {formData.amount > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className={`pl-10 ${errors.date ? "border-destructive" : ""}`}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <Textarea
              id="note"
              placeholder="Deskripsi transaksi..."
              value={formData.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
              className={errors.note ? "border-destructive" : ""}
              rows={3}
              maxLength={500}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.note?.length || 0}/500 karakter
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
            <Button type="submit" disabled={isLoading || compatibleAccounts.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Transaksi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
