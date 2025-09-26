"use client";

import { useState } from "react";
import { RoomList, RoomStats } from "@/components/room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bed, BarChart3, Building2, Users } from "lucide-react";
import type { RoomListItem } from "@/server/types";

export default function RoomsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle room actions
  const handleRoomEdit = (room: RoomListItem) => {
    // Navigate to edit page
    window.location.href = `/dashboard/adminkos/rooms/${room.id}/edit`;
  };

  const handleRoomDelete = async (room: RoomListItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kamar "${room.roomType} ${room.roomNumber}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }

      // Refresh the list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Gagal menghapus kamar");
    }
  };

  const handleRoomToggleAvailability = () => {
    // Refresh the list after availability change
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Kamar</h1>
          <p className="text-muted-foreground">
            Kelola kamar di semua properti Anda dan pantau ketersediaan
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/adminkos/rooms/create">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kamar
          </a>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Daftar Kamar
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Statistik Kamar</h2>
            <RoomStats key={refreshKey} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => window.location.href = '/dashboard/adminkos/rooms/create'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Tambah Kamar Baru
                </CardTitle>
                <CardDescription>
                  Daftarkan kamar baru di properti Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tambah kamar dengan foto, fasilitas, dan harga yang menarik
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/dashboard/adminkos/rooms?isAvailable=false'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Kamar Terisi
                </CardTitle>
                <CardDescription>
                  Lihat kamar yang sedang ditempati
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Kelola kamar yang sedang disewa dan pantau status penyewa
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/dashboard/adminkos/properties'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Kelola Properti
                </CardTitle>
                <CardDescription>
                  Kembali ke manajemen properti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Kelola informasi properti, fasilitas, dan peraturan
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Rooms */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Kamar Terbaru</h2>
              <Button variant="outline" asChild>
                <a href="/dashboard/adminkos/rooms?tab=rooms">
                  Lihat Semua
                </a>
              </Button>
            </div>
            <RoomList
              key={`recent-${refreshKey}`}
              onRoomEdit={handleRoomEdit}
              onRoomDelete={handleRoomDelete}
              onRoomToggleAvailability={handleRoomToggleAvailability}
              showProperty={true}
              showCreateButton={false}
            />
          </div>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <RoomList
            key={`all-${refreshKey}`}
            onRoomEdit={handleRoomEdit}
            onRoomDelete={handleRoomDelete}
            onRoomToggleAvailability={handleRoomToggleAvailability}
            showProperty={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
