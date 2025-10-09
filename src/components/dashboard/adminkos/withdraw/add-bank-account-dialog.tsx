"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { BankFromAPI } from "@/server/types/bank-account";

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddBankAccountDialog({ open, onOpenChange, onSuccess }: AddBankAccountDialogProps) {
  const [banks, setBanks] = React.useState<BankFromAPI[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Fetch banks on mount
  React.useEffect(() => {
    if (open) {
      fetchBanks();
    }
  }, [open]);

  const fetchBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const response = await fetch("/api/banks");
      const data = await response.json();

      if (data.success) {
        setBanks(data.data);
      } else {
        alert("Gagal memuat daftar bank");
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
      alert("Gagal memuat daftar bank");
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleBankChange = (bankCode: string) => {
    const selectedBank = banks.find((b) => b.kode === bankCode);
    setFormData({
      ...formData,
      bankCode,
      bankName: selectedBank?.nama || "",
    });
    setErrors({ ...errors, bankCode: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.bankCode) newErrors.bankCode = "Bank wajib dipilih";
    if (!formData.accountNumber) newErrors.accountNumber = "Nomor rekening wajib diisi";
    if (!formData.accountName) newErrors.accountName = "Nama pemilik rekening wajib diisi";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/adminkos/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Pengajuan rekening bank berhasil dibuat. Menunggu persetujuan Superadmin.");
        setFormData({
          bankCode: "",
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        alert(data.error || "Gagal membuat pengajuan rekening bank");
      }
    } catch (error) {
      console.error("Error submitting bank account:", error);
      alert("Gagal membuat pengajuan rekening bank");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Daftarkan Rekening Bank</DialogTitle>
          <DialogDescription>
            Daftarkan rekening bank Anda untuk menerima pembayaran penarikan dana.
            Rekening akan diverifikasi oleh Superadmin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank">Bank *</Label>
            {isLoadingBanks ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={formData.bankCode} onValueChange={handleBankChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bank" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {banks.map((bank) => (
                    <SelectItem key={bank.kode} value={bank.kode}>
                      {bank.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.bankCode && (
              <p className="text-sm text-destructive">{errors.bankCode}</p>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Nomor Rekening *</Label>
            <Input
              id="accountNumber"
              type="text"
              placeholder="Contoh: 1234567890"
              value={formData.accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Only numbers
                setFormData({ ...formData, accountNumber: value });
                setErrors({ ...errors, accountNumber: "" });
              }}
              maxLength={50}
            />
            {errors.accountNumber && (
              <p className="text-sm text-destructive">{errors.accountNumber}</p>
            )}
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Nama Pemilik Rekening *</Label>
            <Input
              id="accountName"
              type="text"
              placeholder="Sesuai dengan nama di rekening bank"
              value={formData.accountName}
              onChange={(e) => {
                setFormData({ ...formData, accountName: e.target.value });
                setErrors({ ...errors, accountName: "" });
              }}
              maxLength={255}
            />
            {errors.accountName && (
              <p className="text-sm text-destructive">{errors.accountName}</p>
            )}
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
              Daftarkan Rekening
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

