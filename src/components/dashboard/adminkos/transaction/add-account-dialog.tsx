"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import type { CreateLedgerAccountDTO, LedgerAccountType } from "@/server/types/ledger";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLedgerAccountDTO) => Promise<void>;
  isLoading?: boolean;
}

export function AddAccountDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: AddAccountDialogProps) {
  const [formData, setFormData] = useState<CreateLedgerAccountDTO>({
    name: "",
    type: "INCOME",
    code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accountTypes = [
    {
      value: "INCOME" as LedgerAccountType,
      label: "Pemasukan",
      description: "Untuk mencatat uang masuk",
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      examples: ["Pembayaran Kos", "Pendapatan Lain", "Bonus"]
    },
    {
      value: "EXPENSE" as LedgerAccountType,
      label: "Pengeluaran",
      description: "Untuk mencatat uang keluar",
      icon: <TrendingDown className="h-4 w-4 text-red-600" />,
      examples: ["Perawatan", "Kebersihan", "Gaji Resepsionis", "Listrik"]
    },
    {
      value: "OTHER" as LedgerAccountType,
      label: "Lainnya",
      description: "Untuk transaksi khusus",
      icon: <DollarSign className="h-4 w-4 text-blue-600" />,
      examples: ["Penarikan Dana", "Penyesuaian", "Transfer"]
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama akun wajib diisi";
    } else if (formData.name.length < 3) {
      newErrors.name = "Nama akun minimal 3 karakter";
    } else if (formData.name.length > 100) {
      newErrors.name = "Nama akun maksimal 100 karakter";
    }

    if (!formData.type) {
      newErrors.type = "Tipe akun wajib dipilih";
    }

    if (formData.code && formData.code.length < 2) {
      newErrors.code = "Kode akun minimal 2 karakter";
    } else if (formData.code && formData.code.length > 30) {
      newErrors.code = "Kode akun maksimal 30 karakter";
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
        name: formData.name.trim(),
        type: formData.type,
        code: formData.code?.trim() || undefined,
      });

      // Reset form on success
      setFormData({
        name: "",
        type: "INCOME",
        code: "",
      });
      setErrors({});
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating account:", error);
      // Show error message to user
      const errorMessage = error?.message || "Gagal membuat akun";
      setErrors({ name: errorMessage });
    }
  };

  const handleInputChange = (field: keyof CreateLedgerAccountDTO, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const selectedType = accountTypes.find(type => type.value === formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Akun Baru</DialogTitle>
          <DialogDescription>
            Buat kategori akun baru untuk mengorganisir transaksi keuangan Anda.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="type">Tipe Akun *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                <SelectValue placeholder="Pilih tipe akun" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      {type.icon}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
            
            {/* Type Description */}
            {selectedType && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{selectedType.description}</p>
                    <div>
                      <p className="text-xs font-medium mb-1">Contoh:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedType.examples.map((example, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Akun *</Label>
            <Input
              id="name"
              placeholder="Contoh: Perawatan Gedung"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Nama yang jelas dan deskriptif untuk kategori transaksi
            </p>
          </div>

          {/* Account Code (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="code">Kode Akun (Opsional)</Label>
            <Input
              id="code"
              placeholder="Contoh: PRW"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
              className={errors.code ? "border-destructive" : ""}
              maxLength={30}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Kode singkat untuk memudahkan identifikasi (akan diubah ke huruf besar)
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
              Buat Akun
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
