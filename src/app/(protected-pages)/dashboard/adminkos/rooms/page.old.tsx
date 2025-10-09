"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RoomList, RoomStats, RoomQuickActions } from "@/components/dashboard/adminkos/room";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Bed, Plus, BarChart3, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import type { RoomListItem } from "@/server/types";

export default function AdminKosRoomsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<RoomListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();

  // Handle room actions
  const handleRoomEdit = (room: RoomListItem) => {
    // Navigate to edit page
    window.location.href = `/dashboard/adminkos/rooms/${room.id}/edit`;
  };

  const handleRoomDelete = (room: RoomListItem) => {
    setRoomToDelete(room);
    setIsDeleteDialogOpen(true);
  };

  // Handle room deletion
  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      setIsDeleting(true);
      
      console.log("🗑️ Attempting to delete room:", roomToDelete.id);
      
      const response = await fetch(`/api/rooms/${roomToDelete.id}`, {
        method: "DELETE",
      });

      console.log("🗑️ Delete response status:", response.status);
      console.log("🗑️ Delete response ok:", response.ok);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Gagal menghapus kamar";
        try {
          const errorData = await response.json();
          console.log("🗑️ Error response data:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.log("🗑️ Could not parse error response");
        }
        
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const result = await response.json();
      console.log("🗑️ Delete success result:", result);

      // Show success toast
      toast.success("Kamar berhasil dihapus!", {
        description: `"${roomToDelete.roomType} ${roomToDelete.roomNumber}" telah dihapus secara permanen dari sistem.`,
        duration: 5000,
      });

      // Refresh the list
      setRefreshKey(prev => prev + 1);
      
    } catch (err) {
      console.error("🗑️ Error deleting room:", err);
      const errorMessage = err instanceof Error ? err.message : "Gagal menghapus kamar. Silakan coba lagi.";
      
      // Show error toast
      toast.error("Gagal menghapus kamar", {
        description: errorMessage,
        duration: 7000,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  // Check for success messages from URL params
  useEffect(() => {
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");
    
    if (updated === "true") {
      setShowSuccessMessage("updated");
      // Clear the URL param
      const url = new URL(window.location.href);
      url.searchParams.delete("updated");
      window.history.replaceState({}, "", url.toString());
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(null), 5000);
    } else if (deleted === "true") {
      setShowSuccessMessage("deleted");
      // Clear the URL param
      const url = new URL(window.location.href);
      url.searchParams.delete("deleted");
      window.history.replaceState({}, "", url.toString());
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(null), 5000);
    }
  }, [searchParams]);

  return (
    <DashboardLayout title="Manajemen Kamar">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Success Messages */}
        {showSuccessMessage && (
          <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <AlertDescription className="flex-1 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-green-900">
                    {showSuccessMessage === "updated" && "Kamar Berhasil Diperbarui!"}
                    {showSuccessMessage === "deleted" && "Kamar Berhasil Dihapus!"}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {showSuccessMessage === "updated" && "Perubahan data kamar telah disimpan ke sistem."}
                    {showSuccessMessage === "deleted" && "Kamar telah dihapus secara permanen dari sistem."}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuccessMessage(null)}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full"
                >
                  ×
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}


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
            {/* Room Statistics */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Statistik Kamar</h2>
              <RoomStats />
            </div>

            {/* Quick Actions */}
            <RoomQuickActions />

            {/* Recent Rooms */}
            <div>
              <div className="flex items-center justify-between mb-4">
              </div>
              <RoomList 
                key={`recent-${refreshKey}`}
                onRoomEdit={handleRoomEdit}
                onRoomDelete={handleRoomDelete}
                showCreateButton={false} 
              />
            </div>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6">
            <div className="flex items-center justify-between">
            </div>
            <RoomList 
              key={`all-${refreshKey}`}
              onRoomEdit={handleRoomEdit}
              onRoomDelete={handleRoomDelete}
            />
          </TabsContent>
        </Tabs>

        {/* Enhanced Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader className="text-center pb-2">
              {/* Icon with animated background */}
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <Trash2 className="h-7 w-7 text-red-600" />
                </div>
              </div>
              
              <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                Hapus Kamar Permanen?
              </AlertDialogTitle>
              
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-center">
                  {/* Room info highlight */}
                  {roomToDelete && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-600 mb-1">Kamar yang akan dihapus:</div>
                      <div className="font-semibold text-gray-900 text-base">
                        {roomToDelete.roomType} {roomToDelete.roomNumber}
                      </div>
                      {roomToDelete.property && (
                        <div className="text-sm text-gray-500 mt-1">
                          di {roomToDelete.property.name}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warning section */}
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-red-800 text-sm mb-2">
                          Tindakan Tidak Dapat Dibatalkan
                        </div>
                        <div className="text-sm text-red-700 leading-relaxed">
                          Data yang akan dihapus permanen:
                          <ul className="mt-2 space-y-1 text-xs">
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Informasi kamar dan pricing
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Semua foto kamar
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Daftar fasilitas dan deskripsi
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Riwayat ketersediaan
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation question */}
                  <div className="text-gray-700 font-medium">
                    Apakah Anda yakin ingin melanjutkan?
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-6">
              <AlertDialogCancel 
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menghapus...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Ya, Hapus Permanen
                  </div>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
