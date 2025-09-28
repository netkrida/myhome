"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MultiStepForm, useMultiStepForm, type Step } from "@/components/ui/multi-step-form";
import { toast } from "sonner";
import { FormPersistence } from "@/lib/form-persistence";
import { Step1BasicData } from "./step-1-basic-data";
import { Step2Location } from "./step-2-location";
import { Step3Images } from "./step-3-images";
import { Step4FacilitiesRules } from "./step-4-facilities-rules";
import type { CreatePropertyInput } from "@/server/schemas/property.schemas";
import type { PropertyDetailItem } from "@/server/types";
import { PROPERTY_FACILITIES, PROPERTY_RULES } from "@/server/types/property";

// Wrapper component to provide setStepValid to Step2Location
function Step2LocationWrapper({ onDataChange, initialData }: { onDataChange: any, initialData: any }) {
  const { setStepValid } = useMultiStepForm();
  
  console.log("🔧 Step2LocationWrapper - setStepValid available:", !!setStepValid);
  
  // Create wrapper function to add logging
  const setStepValidityWithLogging = useCallback((stepIndex: number, isValid: boolean) => {
    console.log(`🚀 Step2LocationWrapper - Setting step ${stepIndex} validity to:`, isValid);
    setStepValid(stepIndex, isValid);
  }, [setStepValid]);
  
  return (
    <Step2Location
      onDataChange={onDataChange}
      initialData={initialData}
      setStepValidity={setStepValidityWithLogging}
    />
  );
}

interface PropertyCreationFormProps {
  className?: string;
  initialData?: PropertyDetailItem;
  onSubmit?: (data: any) => Promise<any>;
  mode?: "create" | "edit";
}

export function PropertyCreationForm({ 
  className, 
  initialData, 
  onSubmit,
  mode = "create"
}: PropertyCreationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state - structured according to schema
  const [formData, setFormData] = useState<Partial<CreatePropertyInput>>({});

  // Debug initial state and track formData changes
  useEffect(() => {
    console.log('PropertyCreationForm initialized, initial formData:', formData);
  }, []);

  // Track formData changes for debugging
  useEffect(() => {
    console.log('=== FORM DATA CHANGED ===');
    console.log('Current formData:', formData);
    console.log('FormData keys:', Object.keys(formData));
    console.log('Step1 exists:', !!formData.step1);
    console.log('Step2 exists:', !!formData.step2);
    console.log('Step3 exists:', !!formData.step3);
    console.log('Step4 exists:', !!formData.step4);
  }, [formData]);

  // Initialize form data from initialData (edit mode) or persistence (create mode)
  useEffect(() => {
    if (mode === "edit" && initialData) {
      // In edit mode, populate form with existing data
      console.log('Edit mode: initializing with existing data:', initialData);
      
      const editFormData: Partial<CreatePropertyInput> = {};

      // Step 1: Basic data
      editFormData.step1 = {
        name: initialData.name,
        buildYear: initialData.buildYear,
        propertyType: initialData.propertyType,
        roomTypes: initialData.roomTypes || [],
        totalRooms: initialData.totalRooms,
        availableRooms: initialData.availableRooms,
        description: initialData.description,
      };

      // Step 2: Location
      editFormData.step2 = {
        location: {
          provinceName: initialData.location.provinceName,
          regencyName: initialData.location.regencyName,
          districtName: initialData.location.districtName,
          fullAddress: initialData.location.fullAddress,
          latitude: initialData.location.latitude,
          longitude: initialData.location.longitude,
        }
      };

      // Step 3: Images
      editFormData.step3 = {
        images: {
          buildingPhotos: initialData.images?.filter(img => img.category === 'BUILDING_PHOTOS').map(img => img.imageUrl) || [],
          sharedFacilitiesPhotos: initialData.images?.filter(img => img.category === 'SHARED_FACILITIES_PHOTOS').map(img => img.imageUrl) || [],
          floorPlanPhotos: initialData.images?.filter(img => img.category === 'FLOOR_PLAN_PHOTOS').map(img => img.imageUrl) || [],
        }
      };

      // Step 4: Facilities and Rules
      editFormData.step4 = {
        facilities: initialData.facilities || [],
        rules: initialData.rules || []
      };

      setFormData(editFormData);
    } else if (mode === "create") {
      // In create mode, restore from persistence
      const restoreFormData = () => {
        try {
          // Try to restore data from each step
          const step1Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-1", useSessionStorage: true });
          const step2Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-2", useSessionStorage: true });
          const step3Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-3", useSessionStorage: true });
          const step4Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-4", useSessionStorage: true });

          const restoredData: Partial<CreatePropertyInput> = {};

          if (step1Data?.data) {
            const data = step1Data.data;
            restoredData.step1 = {
              name: data.name,
              buildYear: data.buildYear,
              propertyType: data.propertyType,
              roomTypes: data.roomTypes,
              totalRooms: data.totalRooms,
              availableRooms: data.availableRooms || data.totalRooms,
              description: data.description,
            };
          }

          if (step2Data?.data) {
            const data = step2Data.data;
            restoredData.step2 = {
              location: {
                // Omit codes since we don't have proper mapping - they're optional now
                provinceName: data.provinceName,
                regencyName: data.regencyName,
                districtName: data.districtName,
                fullAddress: data.fullAddress,
                latitude: data.latitude,
                longitude: data.longitude,
              }
            };
          }

          if (step3Data?.data) {
            const data = step3Data.data;
            restoredData.step3 = {
              images: {
                buildingPhotos: data.buildingPhotos || [],
                sharedFacilitiesPhotos: data.sharedFacilitiesPhotos || [],
                floorPlanPhotos: data.floorPlanPhotos || [],
              }
            };
          }

          if (step4Data?.data) {
            const data = step4Data.data;
            // Create lookup maps for facilities and rules
            const propertyFacilitiesMap = Object.fromEntries(
              PROPERTY_FACILITIES.property.map(f => [f.id, f.name])
            );
            const parkingFacilitiesMap = Object.fromEntries(
              PROPERTY_FACILITIES.parking.map(f => [f.id, f.name])
            );
            const rulesMap = Object.fromEntries(
              PROPERTY_RULES.map(r => [r.id, r.name])
            );

            restoredData.step4 = {
              facilities: [
                ...(data.propertyFacilities || []).map((id: string) => ({
                  id,
                  name: propertyFacilitiesMap[id] || id,
                  category: "property" as const,
                })),
                ...(data.parkingFacilities || []).map((id: string) => ({
                  id,
                  name: parkingFacilitiesMap[id] || id,
                  category: "parking" as const,
                })),
                ...(data.customFacilities || []).map((name: string) => ({
                  id: name.toLowerCase().replace(/\s+/g, '_'),
                  name,
                  category: "property" as const,
                })),
              ],
              rules: [
                ...(data.rules || []).map((id: string) => ({
                  id,
                  name: rulesMap[id] || id,
                })),
                ...(data.customRules || []).map((name: string) => ({
                  id: name.toLowerCase().replace(/\s+/g, '_'),
                  name,
                })),
              ]
            };
          }

          if (Object.keys(restoredData).length > 0) {
            console.log('Restoring form data from persistence:', restoredData);
            setFormData(restoredData);
          }
        } catch (error) {
          console.error('Error restoring form data:', error);
        }
      };

      restoreFormData();
    }
  }, [mode, initialData]);

  // Handle step data changes with useCallback to prevent unnecessary re-renders
  const handleStep1Change = useCallback((data: any) => {
    console.log('handleStep1Change called with:', data);
    setFormData(prev => {
      const newData = {
        ...prev,
        step1: {
          name: data.name,
          buildYear: data.buildYear,
          propertyType: data.propertyType,
          roomTypes: data.roomTypes,
          totalRooms: data.totalRooms,
          availableRooms: data.availableRooms || data.totalRooms, // Use availableRooms field or fallback to totalRooms
          description: data.description,
        }
      };
      console.log('Updated formData after step1:', newData);
      return newData;
    });
  }, []);

  const handleStep2Change = useCallback((data: any) => {
    console.log('=== HANDLE STEP2 CHANGE ===');
    console.log('handleStep2Change called with:', data);
    
    const newStep2Data = {
      location: {
        // Omit codes since we don't have proper mapping - they're optional now
        provinceName: data.provinceName,
        regencyName: data.regencyName,
        districtName: data.districtName,
        fullAddress: data.fullAddress,
        latitude: data.latitude,
        longitude: data.longitude,
      }
    };
    
    console.log('Creating step2 data:', newStep2Data);
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        step2: newStep2Data
      };
      console.log('Updated formData after step2 change:', newFormData);
      return newFormData;
    });
  }, []);

  const handleStep3Change = useCallback((data: any) => {
    console.log('handleStep3Change called with:', data);
    setFormData(prev => ({
      ...prev,
      step3: {
        images: {
          buildingPhotos: data.buildingPhotos || [],
          sharedFacilitiesPhotos: data.sharedFacilitiesPhotos || [],
          floorPlanPhotos: data.floorPlanPhotos || [],
        }
      }
    }));
  }, []);

  const handleStep4Change = useCallback((data: any) => {
    console.log('handleStep4Change called with:', data);
    // Create lookup maps for facilities and rules
    const propertyFacilitiesMap = Object.fromEntries(
      PROPERTY_FACILITIES.property.map(f => [f.id, f.name])
    );
    const parkingFacilitiesMap = Object.fromEntries(
      PROPERTY_FACILITIES.parking.map(f => [f.id, f.name])
    );
    const rulesMap = Object.fromEntries(
      PROPERTY_RULES.map(r => [r.id, r.name])
    );

    const facilities = [
      ...(data.propertyFacilities || []).map((id: string) => ({
        id,
        name: propertyFacilitiesMap[id] || id,
        category: "property" as const,
      })),
      ...(data.parkingFacilities || []).map((id: string) => ({
        id,
        name: parkingFacilitiesMap[id] || id,
        category: "parking" as const,
      })),
      ...(data.customFacilities || []).map((name: string) => ({
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        category: "property" as const,
      })),
    ];

    const rules = [
      ...(data.rules || []).map((id: string) => ({
        id,
        name: rulesMap[id] || id,
      })),
      ...(data.customRules || []).map((name: string) => ({
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name,
      })),
    ];

    // Ensure we have at least one facility and one rule
    if (facilities.length === 0) {
      facilities.push({
        id: "basic_facility",
        name: "Fasilitas Dasar",
        category: "property" as const,
      });
    }

    if (rules.length === 0) {
      rules.push({
        id: "basic_rule",
        name: "Peraturan Dasar",
      });
    }

    setFormData(prev => ({
      ...prev,
      step4: {
        facilities,
        rules
      }
    }));
  }, []);

  // Handle form completion
  const handleComplete = useCallback(async () => {
    try {
      setIsSubmitting(true);

      console.log('=== FORM COMPLETION DEBUG ===');
      console.log('Mode:', mode);
      console.log('handleComplete called, current formData:', formData);
      console.log('formData keys:', Object.keys(formData));
      console.log('Step 1 data:', formData.step1);
      console.log('Step 2 data:', formData.step2);
      console.log('Step 3 data:', formData.step3);
      console.log('Step 4 data:', formData.step4);

      // Enhanced validation with detailed logging
      console.log('=== DETAILED STEP2 DEBUG ===');
      console.log('formData.step2:', formData.step2);
      console.log('formData.step2?.location:', formData.step2?.location);
      if (formData.step2?.location) {
        console.log('step2.location.provinceName:', formData.step2.location.provinceName);
        console.log('step2.location.regencyName:', formData.step2.location.regencyName);
        console.log('step2.location.districtName:', formData.step2.location.districtName);
        console.log('step2.location.fullAddress:', formData.step2.location.fullAddress);
      }

      const validationResults = {
        step1Valid: !!(formData.step1?.name),
        step2Valid: !!(formData.step2?.location?.provinceName && formData.step2?.location?.regencyName && formData.step2?.location?.districtName && formData.step2?.location?.fullAddress),
        step3Valid: !!(formData.step3?.images),
        step4Valid: !!(formData.step4?.facilities),
      };

      console.log('Validation results:', validationResults);

      // Check if any step is invalid
      const invalidSteps = Object.entries(validationResults)
        .filter(([_, isValid]) => !isValid)
        .map(([step, _]) => step);

      if (invalidSteps.length > 0 && mode === "create") {
        console.error("Incomplete form data. Invalid steps:", invalidSteps);
        console.error("Current formData:", JSON.stringify(formData, null, 2));

        // Try to restore data from persistence as a fallback
        console.log("Attempting to restore data from persistence...");
        try {
          const step1Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-1", useSessionStorage: true });
          const step2Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-2", useSessionStorage: true });
          const step3Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-3", useSessionStorage: true });
          const step4Data = FormPersistence.loadFormData<any>({ key: "property-creation-step-4", useSessionStorage: true });

          console.log("Persistence data:", { step1Data, step2Data, step3Data, step4Data });

          if (step1Data?.data || step2Data?.data || step3Data?.data || step4Data?.data) {
            toast.error("Data form terdeteksi di penyimpanan. Silakan refresh halaman untuk memulihkan data.");
          } else {
            toast.error(`Data tidak lengkap. Langkah yang belum selesai: ${invalidSteps.join(', ')}`);
          }
        } catch (error) {
          toast.error(`Data tidak lengkap. Langkah yang belum selesai: ${invalidSteps.join(', ')}`);
        }
        return;
      }

      // Log complete form data for debugging
      console.log("Submitting form data:", JSON.stringify(formData, null, 2));

      // Use custom onSubmit handler if provided (edit mode), otherwise use default API call (create mode)
      if (onSubmit) {
        // Edit mode: use provided onSubmit handler
        const result = await onSubmit(formData);
        console.log("Property update result:", result);
        toast.success("Properti berhasil diperbarui!");
      } else {
        // Create mode: use default API call
        const response = await fetch("/api/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);

          // Show detailed validation errors if available
          if (errorData.details && Array.isArray(errorData.details)) {
            const errorMessages = errorData.details.map((detail: any) =>
              `${detail.path?.join('.') || 'Unknown field'}: ${detail.message}`
            ).join('\n');
            throw new Error(`Validation errors:\n${errorMessages}`);
          }

          throw new Error(errorData.error || "Gagal membuat properti");
        }

        const result = await response.json();
        console.log("Property creation result:", result);
        console.log("Property ID:", result.id);

        // Clear persisted form data
        FormPersistence.clearFormData({ key: "property-creation-step-1", useSessionStorage: true });
        FormPersistence.clearFormData({ key: "property-creation-step-2", useSessionStorage: true });
        FormPersistence.clearFormData({ key: "property-creation-step-3", useSessionStorage: true });
        FormPersistence.clearFormData({ key: "property-creation-step-4", useSessionStorage: true });
        FormPersistence.clearCurrentStep({ key: "property-creation", useSessionStorage: true });

        toast.success("Properti berhasil dibuat! Lanjutkan dengan menambahkan kamar.");

        // Redirect to add room flow for the newly created property
        const redirectUrl = `/dashboard/adminkos/rooms/add?propertyId=${result.id || ''}`;
        console.log("Redirecting to:", redirectUrl);
        router.push(redirectUrl);
      }

    } catch (error) {
      console.error("Error with property:", error);
      const errorMessage = mode === "edit" ? "Gagal memperbarui properti" : "Gagal membuat properti";
      toast.error(error instanceof Error ? error.message : errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, router, mode, onSubmit]);

  // Memoize steps to prevent unnecessary re-renders that could interfere with form data
  const steps: Step[] = useMemo(() => [
    {
      id: "basic-data",
      title: "Data Dasar",
      description: "Informasi dasar tentang kos Anda",
      component: (
        <Step1BasicData
          onDataChange={handleStep1Change}
          initialData={formData.step1}
        />
      ),
      isValid: false,
    },
    {
      id: "location",
      title: "Lokasi",
      description: "Alamat dan koordinat kos",
      component: (
        <Step2LocationWrapper
          onDataChange={handleStep2Change}
          initialData={formData.step2?.location}
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
          initialData={formData.step3?.images}
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
          initialData={formData.step4 ? {
            propertyFacilities: formData.step4.facilities?.filter(f => f.category === 'property').map(f => f.id) || [],
            parkingFacilities: formData.step4.facilities?.filter(f => f.category === 'parking').map(f => f.id) || [],
            customFacilities: [],
            rules: formData.step4.rules?.map(r => r.id) || [],
            customRules: [],
            agreeToTerms: false,
          } : undefined}
        />
      ),
      isValid: false,
    },
  ], [handleStep1Change, handleStep2Change, handleStep3Change, handleStep4Change, formData]);

  return (
    <div className={className}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            {mode === "edit" ? "Edit Properti" : "Tambah Properti Baru"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "edit" 
              ? "Perbarui informasi properti kos Anda"
              : "Lengkapi informasi kos Anda untuk mulai menerima penyewa"
            }
          </p>
        </div>

        {/* Multi-Step Form */}
        <MultiStepForm
          steps={steps}
          onComplete={handleComplete}
          persistenceKey={mode === "edit" ? "property-edit" : "property-creation"}
          enablePersistence={mode === "create"}
        />

        {/* Submission Status */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>
                  {mode === "edit" ? "Memperbarui properti..." : "Membuat properti..."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
