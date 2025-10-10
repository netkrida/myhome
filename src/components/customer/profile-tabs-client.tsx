"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Camera, Lock, Upload } from "lucide-react";
import { toast } from "sonner";
import type { CustomerProfileDetail } from "@/server/types/customer";

interface ProfileTabsClientProps {
  profile: CustomerProfileDetail;
}

export function ProfileTabsClient({ profile }: ProfileTabsClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("Profil berhasil diperbarui");
    setIsLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("Password berhasil diubah");
    setIsLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setIsLoading(true);
    
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success("Foto profil berhasil diperbarui");
    setIsLoading(false);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" />
          Profil
        </TabsTrigger>
        <TabsTrigger value="avatar">
          <Camera className="mr-2 h-4 w-4" />
          Avatar
        </TabsTrigger>
        <TabsTrigger value="password">
          <Lock className="mr-2 h-4 w-4" />
          Password
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
            <CardDescription>
              Perbarui informasi pribadi dan alamat Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    defaultValue={profile.name ?? ""}
                    placeholder="Masukkan nama lengkap"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    defaultValue={profile.phoneNumber ?? ""}
                    placeholder="08xxxxxxxxxx"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={profile.email ?? ""}
                  disabled
                  className="rounded-xl bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email tidak dapat diubah
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Alamat Jalan</Label>
                <Input
                  id="street"
                  defaultValue={profile.address.streetAddress ?? ""}
                  placeholder="Jl. Contoh No. 123"
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi</Label>
                  <Input
                    id="province"
                    defaultValue={profile.address.provinceName ?? ""}
                    placeholder="Provinsi"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regency">Kabupaten/Kota</Label>
                  <Input
                    id="regency"
                    defaultValue={profile.address.regencyName ?? ""}
                    placeholder="Kabupaten/Kota"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Kecamatan</Label>
                  <Input
                    id="district"
                    defaultValue={profile.address.districtName ?? ""}
                    placeholder="Kecamatan"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full sm:w-auto"
              >
                {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Avatar Tab */}
      <TabsContent value="avatar">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Foto Profil</CardTitle>
            <CardDescription>
              Unggah foto profil Anda (maksimal 2MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Avatar className="h-24 w-24 rounded-full border-4 border-border">
                <AvatarImage src={profile.image ?? undefined} alt={profile.name ?? "User"} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold">{profile.name ?? "User"}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge className="mt-2" variant="secondary">
                  {profile.profile?.status ?? "ACTIVE"}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-primary/5">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Klik untuk unggah foto</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG (max. 2MB)</p>
                  </div>
                </div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isLoading}
                />
              </Label>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Password Tab */}
      <TabsContent value="password">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Ubah Password</CardTitle>
            <CardDescription>
              Pastikan password Anda kuat dan aman
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Saat Ini</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Masukkan password saat ini"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Masukkan password baru"
                  className="rounded-xl"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimal 8 karakter, kombinasi huruf dan angka
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Konfirmasi password baru"
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full sm:w-auto"
              >
                {isLoading ? "Mengubah..." : "Ubah Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

