"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useMultiStepForm } from "@/components/ui/multi-step-form";
import { FormPersistence } from "@/lib/form-persistence";
import { PropertyType } from "@/server/types/property";
import { PROPERTY_ROOM_TYPES } from "@/server/types/property";

const step1Schema = z.object({
  name: z.string().min(1, "Nama kos wajib diisi").max(100, "Nama kos maksimal 100 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(1000, "Deskripsi maksimal 1000 karakter"),
  propertyType: z.nativeEnum(PropertyType, {
    errorMap: () => ({ message: "Pilih jenis kos" })
  }),
  buildYear: z.number().min(1900, "Tahun bangun tidak valid").max(new Date().getFullYear(), "Tahun bangun tidak boleh lebih dari tahun ini"),
  totalRooms: z.number().min(1, "Minimal 1 kamar").max(200, "Maksimal 200 kamar"),
  availableRooms: z.number().min(0, "Kamar tersedia tidak boleh negatif").optional(),
  roomTypes: z.array(z.string()).min(1, "Pilih minimal 1 jenis kamar"),
  customRoomType: z.string().optional(),
}).refine((data) => !data.availableRooms || data.availableRooms <= data.totalRooms, {
  message: "Kamar tersedia tidak boleh lebih dari total kamar",
  path: ["availableRooms"],
});

type Step1FormData = z.infer<typeof step1Schema>;

interface Step1BasicDataProps {
  onDataChange: (data: Step1FormData) => void;
  initialData?: Partial<Step1FormData>;
}

const propertyTypeOptions = [
  { value: PropertyType.MALE_ONLY, label: "Kos Putra", description: "Khusus laki-laki", avatar: "👨" },
  { value: PropertyType.FEMALE_ONLY, label: "Kos Putri", description: "Khusus perempuan", avatar: "👩" },
  { value: PropertyType.MIXED, label: "Kos Campur", description: "Laki-laki dan perempuan", avatar: "👥" },
];

export function Step1BasicData({ onDataChange, initialData }: Step1BasicDataProps) {
  const { setStepValid } = useMultiStepForm();
  
  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      propertyType: initialData?.propertyType || PropertyType.MIXED,
      buildYear: initialData?.buildYear || new Date().getFullYear(),
      totalRooms: initialData?.totalRooms || 1,
      roomTypes: initialData?.roomTypes || [],
      customRoomType: initialData?.customRoomType || "",
      availableRooms: initialData?.availableRooms || 1, // Default same as totalRooms
    },
  });

  const watchedData = form.watch();
  const selectedRoomTypes = form.watch("roomTypes") || [];
  const customRoomType = form.watch("customRoomType");

  // Use ref to track if we've already called onDataChange for current data
  const lastDataRef = useRef<string>("");

  // Validate form and update step validity  
  const validateStep = useCallback(() => {
    // Trigger form validation first
    form.trigger().then(() => {
      const isValid = form.formState.isValid;
      const values = form.getValues();
      
      // Manual validation as backup
      const manualIsValid = Boolean(
        values.name && values.name.trim().length > 0 &&
        values.description && values.description.trim().length >= 10 &&
        values.propertyType &&
        values.buildYear && values.buildYear >= 1900 && values.buildYear <= new Date().getFullYear() &&
        values.totalRooms && values.totalRooms >= 1 &&
        values.availableRooms && values.availableRooms >= 1 && values.availableRooms <= values.totalRooms &&
        values.roomTypes && values.roomTypes.length > 0
      );

      const finalIsValid = Boolean(isValid && manualIsValid);
      
      // Debug logging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Step 1 validation:', { 
          formIsValid: isValid, 
          manualIsValid,
          finalIsValid,
          errors: form.formState.errors
        });
      }
      
      setStepValid(0, finalIsValid);
    });
  }, [form, setStepValid]);

  useEffect(() => {
    validateStep();
  }, [validateStep]);

  // Handle data changes with form subscription instead of watchedData dependency
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!value) return;
      
      // Trigger validation on every change
      setTimeout(() => {
        validateStep();
        
        const isValid = form.formState.isValid;
        if (isValid) {
          const currentDataString = JSON.stringify(value);

          // Only update if data actually changed
          if (currentDataString !== lastDataRef.current) {
            lastDataRef.current = currentDataString;
            onDataChange(value as Step1FormData);

            // Persist form data
            try {
              FormPersistence.saveFormData(
                value as Step1FormData,
                {
                  key: "property-creation-step-1",
                  useSessionStorage: true,
                }
              );
            } catch (error) {
              console.warn('Failed to persist form data:', error);
            }
          }
        }
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [form, onDataChange, validateStep]);

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step1FormData>({
      key: "property-creation-step-1",
      useSessionStorage: true,
    });

    if (persistedData?.data && !initialData) {
      form.reset(persistedData.data);
    }
  }, [form, initialData]);

  // Initial validation check with multiple triggers
  useEffect(() => {
    // Trigger initial validation after component mounts
    const triggerValidation = () => {
      form.trigger(); // Force validation
      validateStep();
    };

    // Try immediate validation
    triggerValidation();

    // Also try after a short delay
    const timeoutId = setTimeout(triggerValidation, 100);

    return () => clearTimeout(timeoutId);
  }, [form, validateStep]);

  // Handle room type selection
  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    const currentTypes = selectedRoomTypes || [];
    if (checked) {
      form.setValue("roomTypes", [...currentTypes, roomType]);
    } else {
      form.setValue("roomTypes", currentTypes.filter(type => type !== roomType));
    }
  };

  // Add custom room type
  const addCustomRoomType = () => {
    const currentTypes = selectedRoomTypes || [];
    if (customRoomType && !currentTypes.includes(customRoomType)) {
      form.setValue("roomTypes", [...currentTypes, customRoomType]);
      form.setValue("customRoomType", "");
    }
  };

  // Remove room type
  const removeRoomType = (roomType: string) => {
    const currentTypes = selectedRoomTypes || [];
    form.setValue("roomTypes", currentTypes.filter(type => type !== roomType));
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Property Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kos <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Kos Mawar Indah" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nama yang menarik dan mudah diingat untuk kos Anda
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Kos <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Deskripsikan kos Anda, fasilitas utama, dan keunggulannya..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Jelaskan secara detail tentang kos Anda (minimal 10 karakter)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Type */}
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kos <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kos" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {propertyTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.avatar}</span>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Build Year and Room Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="buildYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Bangun <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2020"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalRooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Kamar <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10"
                        min="1"
                        max="200"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableRooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kamar Tersedia <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10"
                        min="1"
                        max={watchedData.totalRooms || 200}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Room Types */}
        <Card>
          <CardHeader>
            <CardTitle>Jenis Kamar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Predefined Room Types */}
            <div>
              <FormLabel>Pilih Jenis Kamar yang Tersedia <span className="text-destructive">*</span></FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {PROPERTY_ROOM_TYPES.map((roomType) => (
                  <div key={roomType} className="flex items-center space-x-2">
                    <Checkbox
                      id={roomType}
                      checked={selectedRoomTypes.includes(roomType)}
                      onCheckedChange={(checked) => handleRoomTypeChange(roomType, checked as boolean)}
                    />
                    <label
                      htmlFor={roomType}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {roomType}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Room Type */}
            <div>
              <FormLabel>Tambah Jenis Kamar Lainnya</FormLabel>
              <div className="flex gap-2 mt-2">
                <FormField
                  control={form.control}
                  name="customRoomType"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Contoh: Kamar VIP"
                          {...field}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomRoomType();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCustomRoomType}
                  disabled={!customRoomType}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected Room Types */}
            {selectedRoomTypes && selectedRoomTypes.length > 0 && (
              <div>
                <FormLabel>Jenis Kamar Terpilih</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoomTypes.map((roomType) => (
                    <Badge key={roomType} variant="secondary" className="flex items-center gap-1">
                      {roomType}
                      <button
                        type="button"
                        onClick={() => removeRoomType(roomType)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="roomTypes"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
