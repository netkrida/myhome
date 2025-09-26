"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MultiStepForm, type Step } from "@/components/ui/multi-step-form";
import { toast } from "sonner";
import { FormPersistence } from "@/lib/form-persistence";
import { Step1BasicData } from "./step-1-basic-data";
import { Step2Location } from "./step-2-location";
import { Step3Images } from "./step-3-images";
import { Step4FacilitiesRules } from "./step-4-facilities-rules";
import type { CreatePropertyInput } from "@/server/schemas/property.schemas";

interface PropertyCreationFormProps {
  className?: string;
}

export function PropertyCreationForm({ className }: PropertyCreationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<Partial<CreatePropertyInput>>({});

  // Handle step data changes
  const handleStep1Change = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleStep2Change = (data: any) => {
    setFormData(prev => ({ 
      ...prev, 
      location: {
        provinceName: data.provinceName,
        regencyName: data.regencyName,
        districtName: data.districtName,
        fullAddress: data.fullAddress,
        latitude: data.latitude,
        longitude: data.longitude,
      }
    }));
  };

  const handleStep3Change = (data: any) => {
    setFormData(prev => ({ 
      ...prev, 
      images: [
        ...(data.buildingPhotos || []).map((url: string) => ({
          url,
          category: "BUILDING_PHOTOS" as const,
        })),
        ...(data.sharedFacilitiesPhotos || []).map((url: string) => ({
          url,
          category: "SHARED_FACILITIES_PHOTOS" as const,
        })),
        ...(data.floorPlanPhotos || []).map((url: string) => ({
          url,
          category: "FLOOR_PLAN_PHOTOS" as const,
        })),
      ]
    }));
  };

  const handleStep4Change = (data: any) => {
    setFormData(prev => ({ 
      ...prev, 
      facilities: [
        ...(data.propertyFacilities || []),
        ...(data.parkingFacilities || []),
        ...(data.customFacilities || []),
      ],
      rules: [
        ...(data.rules || []),
        ...(data.customRules || []),
      ]
    }));
  };

  // Handle form completion
  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      // Validate required data
      if (!formData.name || !formData.location || !formData.images?.length) {
        toast.error("Data tidak lengkap. Silakan periksa kembali semua langkah.");
        return;
      }

      // Submit to API
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat properti");
      }

      const result = await response.json();

      // Clear persisted form data
      FormPersistence.clearFormData({ key: "property-creation-step-1", useSessionStorage: true });
      FormPersistence.clearFormData({ key: "property-creation-step-2", useSessionStorage: true });
      FormPersistence.clearFormData({ key: "property-creation-step-3", useSessionStorage: true });
      FormPersistence.clearFormData({ key: "property-creation-step-4", useSessionStorage: true });
      FormPersistence.clearCurrentStep({ key: "property-creation", useSessionStorage: true });

      toast.success("Properti berhasil dibuat! Menunggu persetujuan admin.");
      
      // Redirect to property detail or list
      router.push(`/dashboard/properties/${result.id}`);
      
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat properti");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define steps
  const steps: Step[] = [
    {
      id: "basic-data",
      title: "Data Dasar",
      description: "Informasi dasar tentang kos Anda",
      component: (
        <Step1BasicData 
          onDataChange={handleStep1Change}
          initialData={formData}
        />
      ),
      isValid: false,
    },
    {
      id: "location",
      title: "Lokasi",
      description: "Alamat dan koordinat kos",
      component: (
        <Step2Location 
          onDataChange={handleStep2Change}
          initialData={formData.location}
        />
      ),
      isValid: false,
    },
    {
      id: "images",
      title: "Foto",
      description: "Upload foto bangunan dan fasilitas",
      component: (
        <Step3Images 
          onDataChange={handleStep3Change}
          initialData={{
            buildingPhotos: formData.images?.filter(img => img.category === "BUILDING_PHOTOS").map(img => img.url) || [],
            sharedFacilitiesPhotos: formData.images?.filter(img => img.category === "SHARED_FACILITIES_PHOTOS").map(img => img.url) || [],
            floorPlanPhotos: formData.images?.filter(img => img.category === "FLOOR_PLAN_PHOTOS").map(img => img.url) || [],
          }}
        />
      ),
      isValid: false,
    },
    {
      id: "facilities-rules",
      title: "Fasilitas & Peraturan",
      description: "Fasilitas yang tersedia dan peraturan kos",
      component: (
        <Step4FacilitiesRules 
          onDataChange={handleStep4Change}
          initialData={{
            propertyFacilities: formData.facilities?.filter(f => 
              !f.includes("Parkir") && !f.includes("Motor") && !f.includes("Mobil")
            ) || [],
            parkingFacilities: formData.facilities?.filter(f => 
              f.includes("Parkir") || f.includes("Motor") || f.includes("Mobil")
            ) || [],
            customFacilities: [],
            rules: formData.rules || [],
            customRules: [],
            agreeToTerms: false,
          }}
        />
      ),
      isValid: false,
    },
  ];

  return (
    <div className={className}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Tambah Properti Baru</h1>
          <p className="text-muted-foreground mt-2">
            Lengkapi informasi kos Anda untuk mulai menerima penyewa
          </p>
        </div>

        {/* Multi-Step Form */}
        <MultiStepForm
          steps={steps}
          onComplete={handleComplete}
          persistenceKey="property-creation"
          enablePersistence={true}
        />

        {/* Submission Status */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Membuat properti...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
