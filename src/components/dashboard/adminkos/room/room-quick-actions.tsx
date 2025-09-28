"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bed, Plus, Users } from "lucide-react";

export function RoomQuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = '/dashboard/adminkos/rooms/add'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tambah Kamar Baru
          </CardTitle>
          <CardDescription>
            Tambahkan kamar ke properti Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Daftarkan kamar baru dengan informasi lengkap dan foto
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = '/dashboard/adminkos/rooms?tab=rooms'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Kelola Kamar
          </CardTitle>
          <CardDescription>
            Edit dan update informasi kamar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Update harga, fasilitas, dan ketersediaan kamar
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = '/dashboard/adminkos/bookings'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lihat Penyewa
          </CardTitle>
          <CardDescription>
            Kelola data penyewa kamar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pantau booking dan kelola data penyewa aktif
          </p>
        </CardContent>
      </Card>
    </div>
  );
}