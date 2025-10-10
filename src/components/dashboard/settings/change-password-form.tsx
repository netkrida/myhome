"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Password saat ini wajib diisi";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Password baru wajib diisi";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password minimal 8 karakter";
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = "Password harus mengandung minimal 1 huruf besar";
    } else if (!/[a-z]/.test(formData.newPassword)) {
      newErrors.newPassword = "Password harus mengandung minimal 1 huruf kecil";
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = "Password harus mengandung minimal 1 angka";
    }

    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Konfirmasi password wajib diisi";
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Konfirmasi password tidak cocok";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password berhasil diubah");
        // Reset form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        toast.error(data.error || "Gagal mengubah password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Terjadi kesalahan saat mengubah password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>Ubah Password</CardTitle>
        </div>
        <CardDescription>
          Pastikan password Anda kuat dan aman
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Saat Ini *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => {
                  setFormData({ ...formData, currentPassword: e.target.value });
                  setErrors({ ...errors, currentPassword: "" });
                }}
                placeholder="Masukkan password saat ini"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData({ ...formData, newPassword: e.target.value });
                  setErrors({ ...errors, newPassword: "" });
                }}
                placeholder="Masukkan password baru"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka
            </p>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Konfirmasi Password Baru *</Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmNewPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmNewPassword: e.target.value });
                  setErrors({ ...errors, confirmNewPassword: "" });
                }}
                placeholder="Ulangi password baru"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="text-xs text-destructive">{errors.confirmNewPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengubah...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Ubah Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

