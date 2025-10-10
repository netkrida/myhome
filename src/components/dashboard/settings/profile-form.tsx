"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

interface ProfileFormProps {
  initialData: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    provinceCode?: string | null;
    provinceName?: string | null;
    regencyCode?: string | null;
    regencyName?: string | null;
    districtCode?: string | null;
    districtName?: string | null;
    streetAddress?: string | null;
  };
  onSuccess?: () => void;
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: initialData.name || "",
    email: initialData.email || "",
    phoneNumber: initialData.phoneNumber || "",
    provinceCode: initialData.provinceCode || "",
    provinceName: initialData.provinceName || "",
    regencyCode: initialData.regencyCode || "",
    regencyName: initialData.regencyName || "",
    districtCode: initialData.districtCode || "",
    districtName: initialData.districtName || "",
    streetAddress: initialData.streetAddress || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast("berhasil memperbarui profil");
        onSuccess?.();
      } else {
        toast("gagal");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast("gagal memperbarui profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Informasi Profil</CardTitle>
        </div>
        <CardDescription>
          Perbarui informasi profil Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Email digunakan untuk login
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Nomor Telepon</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm">Alamat</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provinceName">Provinsi</Label>
                <Input
                  id="provinceName"
                  value={formData.provinceName}
                  onChange={(e) => setFormData({ ...formData, provinceName: e.target.value })}
                  placeholder="Nama provinsi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regencyName">Kabupaten/Kota</Label>
                <Input
                  id="regencyName"
                  value={formData.regencyName}
                  onChange={(e) => setFormData({ ...formData, regencyName: e.target.value })}
                  placeholder="Nama kabupaten/kota"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="districtName">Kecamatan</Label>
              <Input
                id="districtName"
                value={formData.districtName}
                onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                placeholder="Nama kecamatan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">Alamat Lengkap</Label>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                placeholder="Jalan, nomor rumah, RT/RW, dll"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

