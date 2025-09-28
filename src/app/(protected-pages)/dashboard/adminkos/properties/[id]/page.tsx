"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyDetailView } from "@/components/dashboard/adminkos/properties/property-detail-view";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Building2,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import type { PropertyDetailItem } from "@/server/types";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  // Fetch property details
  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/properties/${propertyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Properti tidak ditemukan");
        } else if (response.status === 403) {
          throw new Error("Anda tidak memiliki akses ke properti ini");
        } else {
          throw new Error("Gagal memuat detail properti");
        }
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Gagal memuat detail properti");
      }

      setProperty(result.data);
    } catch (err) {
      console.error("Error fetching property:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Handle property deletion
  const handleDelete = async () => {
    if (!property) return;

    try {
      setIsDeleting(true);
      
      console.log("🗑️ Attempting to delete property:", propertyId);
      
      const response = await fetch(`/api/properties/${propertyId}`, {
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
        description: `"${property.name}" telah dihapus secara permanen dari sistem.`,
        duration: 5000,
      });

      // Redirect after short delay to let user see the toast
      setTimeout(() => {
        router.push("/dashboard/adminkos/properties?deleted=true");
      }, 1000);
      
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
    }
  };

  // Handle edit navigation
  const handleEdit = () => {
    if (property) {
      router.push(`/dashboard/adminkos/properties/${propertyId}/edit`);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  // Check for success messages from URL params
  useEffect(() => {
    const updated = searchParams.get("updated");
    
    if (updated === "true") {
      setShowSuccessMessage("updated");
      // Clear the URL param
      const url = new URL(window.location.href);
      url.searchParams.delete("updated");
      window.history.replaceState({}, "", url.toString());
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(null), 5000);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <DashboardLayout title="Detail Properti">
        <div className="container mx-auto px-4 lg:px-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout title="Detail Properti">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Terjadi Kesalahan</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {error || "Properti tidak ditemukan"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <Button onClick={fetchProperty}>
                    Coba Lagi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={property.name}>
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
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {showSuccessMessage === "updated" && "Perubahan data properti telah disimpan ke sistem."}
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {property.name}
              </h1>
              <p className="text-muted-foreground">
                Detail informasi properti kos Anda
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline" 
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
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
                      {/* Property name highlight */}
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="text-sm text-gray-600 mb-1">Properti yang akan dihapus:</div>
                        <div className="font-semibold text-gray-900 text-base">
                          "{property.name}"
                        </div>
                      </div>

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
                                  Informasi properti
                                </li>
                                <li className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                  Semua foto ({property.images?.length || 0} foto)
                                </li>
                                <li className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                  Semua kamar ({property.rooms?.length || 0} kamar)
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
                    onClick={handleDelete}
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
        </div>

        {/* Property Detail View */}
        <PropertyDetailView property={property} showEditButton={true} />
      </div>
    </DashboardLayout>
  );
}