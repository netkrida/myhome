"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiStepForm, type Step } from "@/components/ui/multi-step-form";
import { toast } from "sonner";
import { FormPersistence } from "@/lib/form-persistence";
import { Step1RoomPhotos } from "./add-room/step-1-room-photos";
import { Step2RoomFacilities } from "./add-room/step-2-room-facilities";
import { Step3RoomPricing } from "./add-room/step-3-room-pricing";
import { Step4RoomManagement } from "./add-room/step-4-room-management";
import type { CreateRoomDTO } from "@/server/types/room";
import { DepositPercentage } from "@/server/types/room";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Settings, Receipt, Building } from "lucide-react";

// Transform old enum values to new ones
const transformDepositPercentage = (value: any): DepositPercentage | undefined => {
  if (!value) return undefined;

  // Handle old enum values
  switch (value) {
    case "10_PERCENT":
      return DepositPercentage.TEN_PERCENT;
    case "20_PERCENT":
      return DepositPercentage.TWENTY_PERCENT;
    case "30_PERCENT":
      return DepositPercentage.THIRTY_PERCENT;
    case "40_PERCENT":
      return DepositPercentage.FORTY_PERCENT;
    case "50_PERCENT":
      return DepositPercentage.FIFTY_PERCENT;
    // Handle new enum values (pass through)
    case DepositPercentage.TEN_PERCENT:
    case DepositPercentage.TWENTY_PERCENT:
    case DepositPercentage.THIRTY_PERCENT:
    case DepositPercentage.FORTY_PERCENT:
    case DepositPercentage.FIFTY_PERCENT:
      return value;
    default:
      console.warn("Unknown depositPercentage value:", value);
      return undefined;
  }
};

interface RoomCreationFormProps {
  className?: string;
}

interface PropertyData {
  id: string;
  name: string;
  roomTypes: string[];
  totalRooms: number;
}

export function RoomCreationForm({ className }: RoomCreationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");

  console.log("Room creation form - propertyId from URL:", propertyId);
  console.log("Room creation form - all search params:", Object.fromEntries(searchParams.entries()));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [formData, setFormData] = useState<Partial<CreateRoomDTO>>({
    propertyId: propertyId || "",
    step1: undefined,
    step2: undefined,
    step3: undefined,
    step4: undefined,
  });

  // Clear old persisted data on mount to prevent enum conflicts
  useEffect(() => {
    const clearOldData = () => {
      try {
        // Clear all session storage for room creation to prevent enum conflicts
        if (typeof window !== "undefined") {
          const keys = Object.keys(sessionStorage);
          keys.forEach(key => {
            if (key.includes("room-creation")) {
              sessionStorage.removeItem(key);
              console.log("Cleared session storage key:", key);
            }
          });
        }

        console.log("Cleared all room creation data from session storage");
      } catch (error) {
        console.error("Error clearing session storage:", error);
      }
    };

    clearOldData();
  }, []);

  // Fetch property data
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) {
        console.error("Property ID not found in URL parameters");
        toast.error("Property ID tidak ditemukan. Silakan pilih properti terlebih dahulu.");
        router.push("/dashboard/adminkos/properties");
        return;
      }

      try {
        console.log("Fetching property data for ID:", propertyId);
        const response = await fetch(`/api/properties/${propertyId}`);
        console.log("Property fetch response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Property fetch failed:", response.status, errorText);
          throw new Error(`Failed to fetch property data: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log("Property fetch result:", result);
        if (result.success) {
          setPropertyData({
            id: result.data.id,
            name: result.data.name,
            roomTypes: result.data.roomTypes,
            totalRooms: result.data.totalRooms,
          });
          setFormData(prev => ({ ...prev, propertyId: result.data.id }));
        } else {
          throw new Error(result.error || "Failed to fetch property data");
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
        toast.error("Gagal memuat data properti");
        router.push("/dashboard/adminkos/properties");
      }
    };

    fetchPropertyData();
  }, [propertyId, router]);

  // Handle step data changes
  const handleStep1Change = useCallback((data: any) => {
    console.log("Step 1 data changed:", data);
    setFormData(prev => {
      const newData = { ...prev, step1: data };
      console.log("Updated formData after step1 change:", newData);
      return newData;
    });
  }, []);

  const handleStep2Change = useCallback((data: any) => {
    console.log("Step 2 data changed:", data);
    setFormData(prev => {
      const newData = { ...prev, step2: data };
      console.log("Updated formData after step2 change:", newData);
      return newData;
    });
  }, []);

  const handleStep3Change = useCallback((data: any) => {
    console.log("Step 3 data changed:", data);
    setFormData(prev => {
      const newData = { ...prev, step3: data };
      console.log("Updated formData after step3 change:", newData);
      return newData;
    });
  }, []);

  const handleStep4Change = useCallback((data: any) => {
    console.log("Step 4 data changed:", data);
    setFormData(prev => {
      const newData = { ...prev, step4: data };
      console.log("Updated formData after step4 change:", newData);
      return newData;
    });
  }, []);

  // Debug formData changes
  useEffect(() => {
    console.log("FormData state updated:", formData);
  }, [formData]);

  // Handle form completion
  const handleComplete = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Validate all steps are completed
      console.log("Validation check - formData:", JSON.stringify(formData, null, 2));
      console.log("Validation check - formData.step1:", formData.step1);
      console.log("Validation check - formData.step2:", formData.step2);
      console.log("Validation check - formData.step3:", formData.step3);
      console.log("Validation check - formData.step4:", formData.step4);

      if (!formData.step1 || !formData.step2 || !formData.step3 || !formData.step4) {
        console.error("Missing step data:", {
          step1: !!formData.step1,
          step2: !!formData.step2,
          step3: !!formData.step3,
          step4: !!formData.step4,
        });
        console.error("Full formData:", formData);
        toast.error("Semua langkah harus diselesaikan");
        return;
      }

      if (!propertyId) {
        toast.error("Property ID tidak ditemukan");
        return;
      }

      // Validate step1 structure specifically
      if (!formData.step1.roomTypePhotos || Object.keys(formData.step1.roomTypePhotos).length === 0) {
        console.error("Step1 validation failed - no roomTypePhotos:", formData.step1);
        toast.error("Data foto kamar tidak lengkap");
        return;
      }

      // Transform depositPercentage to ensure correct enum values
      const transformedStep3 = formData.step3 ? {
        ...formData.step3,
        depositPercentage: formData.step3.depositPercentage ?
          transformDepositPercentage(formData.step3.depositPercentage) :
          undefined
      } : formData.step3;

      console.log("Original step3.depositPercentage:", formData.step3?.depositPercentage);
      console.log("Transformed step3.depositPercentage:", transformedStep3?.depositPercentage);

      // Submit to API
      const requestData = {
        propertyId,
        step1: formData.step1,
        step2: formData.step2,
        step3: transformedStep3,
        step4: formData.step4
      };

      console.log("Current formData:", JSON.stringify(formData, null, 2));
      console.log("Sending room creation data:", JSON.stringify(requestData, null, 2));
      console.log("Step1 data:", JSON.stringify(requestData.step1, null, 2));
      console.log("Step2 data:", JSON.stringify(requestData.step2, null, 2));
      console.log("Step3 data:", JSON.stringify(requestData.step3, null, 2));
      console.log("Step4 data:", JSON.stringify(requestData.step4, null, 2));

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Room creation failed:", errorData);
        
        // Show more detailed error message if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const detailMessages = errorData.details.map((detail: any) => 
            `${detail.path?.join?.('.') || 'field'}: ${detail.message}`
          ).join(', ');
          throw new Error(`Validation failed: ${detailMessages}`);
        }
        
        throw new Error(errorData.error || "Failed to create rooms");
      }

      await response.json();

      // Clear persisted form data
      FormPersistence.clearFormData({ key: "room-creation-step-1", useSessionStorage: true });
      FormPersistence.clearFormData({ key: "room-creation-step-2", useSessionStorage: true });
      FormPersistence.clearFormData({ key: "room-creation-step-3", useSessionStorage: true });
      FormPersistence.clearFormData({ key: "room-creation-step-4", useSessionStorage: true });
      FormPersistence.clearCurrentStep({ key: "room-creation", useSessionStorage: true });

      toast.success("Kamar berhasil dibuat! Properti dalam proses review.");

      // Redirect to property detail
      router.push(`/dashboard/adminkos/properties/${propertyId}`);

    } catch (error) {
      console.error("Error creating rooms:", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat kamar");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, propertyId, router]);

  // Memoize steps to prevent unnecessary re-renders
  const steps: Step[] = useMemo(() => {
    if (!propertyData) return [];

    return [
      {
        id: "room-photos",
        title: "Foto Kamar",
        description: "Upload foto untuk setiap jenis kamar",
        component: (
          <Step1RoomPhotos
            onDataChange={handleStep1Change}
            initialData={formData.step1}
            roomTypes={propertyData.roomTypes}
          />
        ),
        isValid: false, // Will be updated by step component
      },
      {
        id: "room-facilities",
        title: "Fasilitas",
        description: "Pilih fasilitas kamar dan kamar mandi",
        component: (
          <Step2RoomFacilities
            onDataChange={handleStep2Change}
            initialData={formData.step2}
          />
        ),
        isValid: false, // Will be updated by step component
      },
      {
        id: "room-pricing",
        title: "Harga",
        description: "Tentukan harga sewa dan opsi pembayaran",
        component: (
          <Step3RoomPricing
            onDataChange={handleStep3Change}
            initialData={formData.step3 as any}
            roomTypes={propertyData.roomTypes}
          />
        ),
        isValid: false, // Will be updated by step component
      },
      {
        id: "room-management",
        title: "Pengaturan Kamar",
        description: "Atur detail setiap kamar",
        component: (
          <Step4RoomManagement
            onDataChange={handleStep4Change}
            initialData={formData.step4}
            roomTypes={propertyData.roomTypes}
            totalRooms={propertyData.totalRooms}
          />
        ),
        isValid: false, // Will be updated by step component
      },
    ];
  }, [
    propertyData,
    handleStep1Change,
    handleStep2Change,
    handleStep3Change,
    handleStep4Change,
    formData.step1,
    formData.step2,
    formData.step3,
    formData.step4,
  ]);

  if (!propertyData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data properti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/adminkos/properties/${propertyId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Properti
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Tambah Kamar - {propertyData.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">
                  {propertyData.roomTypes.length} Jenis Kamar
                </Badge>
                <Badge variant="outline">
                  {propertyData.totalRooms} Total Kamar
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Lengkapi informasi kamar untuk properti Anda. Setelah selesai, 
                properti akan dalam status review dan akan ditampilkan setelah disetujui admin.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Step Form */}
        <MultiStepForm
          steps={steps}
          onComplete={handleComplete}
          persistenceKey="room-creation"
          enablePersistence={true}
        />

        {/* Loading State */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="font-medium">Menyimpan data kamar...</p>
                <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
