"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PropertyCreationForm } from "@/components/dashboard/adminkos/add-property/property-creation-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, AlertTriangle } from "lucide-react";
import type { PropertyDetailItem } from "@/server/types";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch property details for editing
  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/properties/${propertyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Properti tidak ditemukan");
        } else if (response.status === 403) {
          throw new Error("Anda tidak memiliki akses untuk mengedit properti ini");
        } else {
          throw new Error("Gagal memuat data properti");
        }
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Gagal memuat data properti");
      }

      setProperty(result.data);
    } catch (err) {
      console.error("Error fetching property:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate properti");
      }

      const result = await response.json();
      
      // Redirect to property detail page
      router.push(`/dashboard/adminkos/properties/${propertyId}?updated=true`);
      
      return result;
    } catch (error) {
      console.error("Error updating property:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <DashboardLayout title="Edit Properti">
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
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout title="Edit Properti">
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
    <DashboardLayout title={`Edit ${property.name}`}>
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/adminkos/properties/${propertyId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Detail
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Edit {property.name}
              </h1>
              <p className="text-muted-foreground">
                Perbarui informasi properti kos Anda
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <PropertyCreationForm
          initialData={property}
          onSubmit={handleFormSubmit}
          mode="edit"
        />
      </div>
    </DashboardLayout>
  );
}