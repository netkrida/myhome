"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PropertyList, PropertyStats } from "@/components/dashboard/adminkos/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Building2, BarChart3, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import type { PropertyListItem } from "@/server/types";

export default function PropertiesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();

  // Handle property actions
  const handlePropertyEdit = (property: PropertyListItem) => {
    // Navigate to edit page
    window.location.href = `/dashboard/adminkos/properties/${property.id}/edit`;
  };

  const handlePropertyView = (property: PropertyListItem) => {
    // Navigate to detail page
    window.location.href = `/dashboard/adminkos/properties/${property.id}`;
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

  const handlePropertyDelete = (property: PropertyListItem) => {
    setPropertyToDelete(property);
    setIsDeleteDialogOpen(true);
  };

  // Handle property deletion confirmation
  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setIsDeleting(true);
      
      console.log("🗑️ Attempting to delete property:", propertyToDelete.id);
      
      const response = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: "DELETE",
      });

      console.log("🗑️ Delete response status:", response.status);
      console.log("🗑️ Delete response ok:", response.ok);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Gagal menghapus properti";
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
      toast.success("Properti berhasil dihapus!", {
        description: `"${propertyToDelete.name}" telah dihapus secara permanen dari sistem.`,
        duration: 5000,
      });

      // Refresh the list
      setRefreshKey(prev => prev + 1);
      
    } catch (err) {
      console.error("🗑️ Error deleting property:", err);
      const errorMessage = err instanceof Error ? err.message : "Gagal menghapus properti. Silakan coba lagi.";
      
      // Show error toast
      toast.error("Gagal menghapus properti", {
        description: errorMessage,
        duration: 7000,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };



  return (
    <DashboardLayout title="Properti Saya">
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
                    {showSuccessMessage === "updated" && "Properti Berhasil Diperbarui!"}
                    {showSuccessMessage === "deleted" && "Properti Berhasil Dihapus!"}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {showSuccessMessage === "updated" && "Perubahan data properti telah disimpan ke sistem."}
                    {showSuccessMessage === "deleted" && "Properti telah dihapus secara permanen dari sistem."}
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

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Properti Saya</h1>
            <p className="text-muted-foreground">
              Kelola properti kos Anda dan pantau performanya
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Daftar Properti
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Statistics */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Statistik Properti</h2>
              <PropertyStats key={refreshKey} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/adminkos/properties/add'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Tambah Properti Baru
                  </CardTitle>
                  <CardDescription>
                    Daftarkan properti kos baru Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Mulai proses pendaftaran properti dengan wizard yang mudah diikuti
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/adminkos/rooms'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Kelola Kamar
                  </CardTitle>
                  <CardDescription>
                    Atur kamar dan ketersediaan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Tambah, edit, dan kelola ketersediaan kamar di semua properti
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/adminkos/bookings'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Laporan & Analitik
                  </CardTitle>
                  <CardDescription>
                    Lihat performa properti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analisis okupansi, pendapatan, dan tren booking
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Properties */}
            <div>
              <PropertyList
                key={`recent-${refreshKey}`}
                onPropertyEdit={handlePropertyEdit}
                onPropertyDelete={handlePropertyDelete}
                showCreateButton={false}
              />
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <PropertyList
              key={`all-${refreshKey}`}
              onPropertyEdit={handlePropertyEdit}
              onPropertyDelete={handlePropertyDelete}
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
                Hapus Properti Permanen?
              </AlertDialogTitle>
              
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-center">
                  {/* Property info highlight */}
                  {propertyToDelete && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-600 mb-1">Properti yang akan dihapus:</div>
                      <div className="font-semibold text-gray-900 text-base">
                        "{propertyToDelete.name}"
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {propertyToDelete.location.districtName}, {propertyToDelete.location.regencyName}
                      </div>
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
                              Informasi properti lengkap
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Semua foto properti
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Semua kamar ({propertyToDelete?.totalRooms || 0} kamar)
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Fasilitas dan peraturan
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              Riwayat dan statistik
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