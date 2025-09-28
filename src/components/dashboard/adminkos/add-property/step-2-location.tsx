"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useMultiStepForm } from "@/components/ui/multi-step-form";
import { FormPersistence } from "@/lib/form-persistence";
import { InteractiveLeafletMap } from "@/components/maps/interactive-leaflet-map";
import { MapLocationPicker } from "@/components/maps/map-location-picker";
import { isCoordinateInIndonesia } from "@/lib/geocoding";

const step2Schema = z.object({
  provinceName: z.string().min(1, "Provinsi wajib diisi"),
  regencyName: z.string().min(1, "Kabupaten/Kota wajib diisi"),
  districtName: z.string().min(1, "Kecamatan wajib diisi"),
  fullAddress: z.string().min(10, "Alamat lengkap minimal 10 karakter").max(500, "Alamat lengkap maksimal 500 karakter"),
  latitude: z.number().min(-90, "Latitude tidak valid").max(90, "Latitude tidak valid"),
  longitude: z.number().min(-180, "Longitude tidak valid").max(180, "Longitude tidak valid"),
});

type Step2FormData = z.infer<typeof step2Schema>;

interface Step2LocationProps {
  onDataChange: (data: Step2FormData) => void;
  initialData?: Partial<Step2FormData>;
  setStepValidity?: (step: number, isValid: boolean) => void;
}

// Indonesian provinces (complete list)
const provinces = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat", 
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Jawa", // Untuk menampung hasil OSM yang masih menggunakan "Jawa"
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Banten",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Sulawesi Tengah",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Gorontalo",
  "Sulawesi Barat",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Barat Daya"
];

export function Step2Location({ onDataChange, initialData, setStepValidity }: Step2LocationProps) {
  const { setStepValid } = useMultiStepForm();
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [geocodingSuccess, setGeocodingSuccess] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -6.2088, lng: 106.8456 }); // Jakarta default
  const [lastGeocodedCoords, setLastGeocodedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      provinceName: initialData?.provinceName || "",
      regencyName: initialData?.regencyName || "",
      districtName: initialData?.districtName || "",
      fullAddress: initialData?.fullAddress || "",
      latitude: initialData?.latitude || -6.2088,
      longitude: initialData?.longitude || 106.8456,
    },
  });

  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");

  // Watch form state for debugging
  React.useEffect(() => {
    console.log("🔍 Step2Location - Form state changed:", {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      isDirty: form.formState.isDirty,
      isSubmitted: form.formState.isSubmitted,
      touchedFields: form.formState.touchedFields,
      dirtyFields: form.formState.dirtyFields
    });

    // Update step validity based on form state
    const values = form.getValues();
    
    // Detailed field validation logging
    console.log("🔍 Step2Location - Detailed field values:", {
      provinceName: { value: values.provinceName, type: typeof values.provinceName, length: values.provinceName?.length },
      regencyName: { value: values.regencyName, type: typeof values.regencyName, length: values.regencyName?.length },
      districtName: { value: values.districtName, type: typeof values.districtName, length: values.districtName?.length },
      fullAddress: { value: values.fullAddress, type: typeof values.fullAddress, length: values.fullAddress?.length },
      latitude: { value: values.latitude, type: typeof values.latitude },
      longitude: { value: values.longitude, type: typeof values.longitude }
    });

    // Individual field validation checks
    const fieldChecks = {
      formIsValid: form.formState.isValid,
      hasLatitude: values.latitude !== undefined && values.latitude !== null && !isNaN(values.latitude),
      hasLongitude: values.longitude !== undefined && values.longitude !== null && !isNaN(values.longitude),
      hasProvince: Boolean(values.provinceName && values.provinceName.trim().length > 0),
      hasRegency: Boolean(values.regencyName && values.regencyName.trim().length > 0),
      hasDistrict: Boolean(values.districtName && values.districtName.trim().length > 0),
      hasAddress: Boolean(values.fullAddress && values.fullAddress.trim().length >= 10)
    };

    const isStepValid = fieldChecks.formIsValid && 
                       fieldChecks.hasLatitude && 
                       fieldChecks.hasLongitude &&
                       fieldChecks.hasProvince &&
                       fieldChecks.hasRegency &&
                       fieldChecks.hasDistrict &&
                       fieldChecks.hasAddress;

    console.log("📊 Step validity check:", {
      ...fieldChecks,
      finalStepValid: isStepValid
    });

    // Detailed error analysis
    if (form.formState.errors && Object.keys(form.formState.errors).length > 0) {
      console.log("❌ Form validation errors:", form.formState.errors);
      Object.entries(form.formState.errors).forEach(([field, error]) => {
        console.log(`❌ Field '${field}' error:`, error);
      });
    }

    if (setStepValidity) {
      console.log(`🚀 Setting step 1 (Step2Location) validity to: ${isStepValid}`);
      setStepValidity(1, isStepValid); // Step 2 has index 1 (0-based)
    }
  }, [form.formState, setStepValidity, form]);

  // Initial validation trigger
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🎯 Initial validation trigger");
      form.trigger();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [form]);

  // Trigger validation when form values change
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed:", values);
      // Auto-trigger validation whenever any field changes
      setTimeout(() => {
        console.log("🔄 Auto-triggering validation after value change");
        form.trigger();
      }, 100);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Call onDataChange when form values change
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      // Only call onDataChange if we have valid data
      if (values.provinceName && values.regencyName && values.districtName && values.fullAddress &&
          values.latitude !== undefined && values.longitude !== undefined) {
        console.log("📤 Step2Location - Calling onDataChange with:", values);
        // Type assertion since we've checked all required fields exist
        onDataChange(values as Step2FormData);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, onDataChange]);  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step2FormData>({
      key: "property-creation-step-2",
      useSessionStorage: true,
    });

    if (persistedData?.data && !initialData) {
      form.reset(persistedData.data);
      setMapCenter({ lat: persistedData.data.latitude, lng: persistedData.data.longitude });
      
      // Call onDataChange with persisted data
      console.log("📤 Calling onDataChange with persisted data:", persistedData.data);
      onDataChange(persistedData.data);
    }
    
    // Trigger initial validation
    setTimeout(() => {
      const currentValues = form.getValues();
      const isValid = form.formState.isValid;
      console.log("🚀 Initial form state:", { currentValues, isValid });
      
      // Force validation trigger
      form.trigger();
      
      // If we have initial data, call onDataChange
      if (initialData && currentValues.provinceName && currentValues.regencyName && 
          currentValues.districtName && currentValues.fullAddress) {
        console.log("📤 Calling onDataChange with initial data:", currentValues);
        onDataChange(currentValues);
      }
    }, 100);
  }, [form, initialData]);

  // Update map center when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  // Perform reverse geocoding using our Nominatim API
  const performReverseGeocoding = useCallback(async (lat: number, lng: number, source: 'map' | 'input' | 'geolocation' = 'map') => {
    // Skip if coordinates haven't changed significantly (to avoid unnecessary API calls)
    if (lastGeocodedCoords && 
        Math.abs(lastGeocodedCoords.lat - lat) < 0.0001 && 
        Math.abs(lastGeocodedCoords.lng - lng) < 0.0001) {
      return;
    }

    // Validate coordinates
    if (!isCoordinateInIndonesia(lat, lng)) {
      setGeocodingError("Koordinat berada di luar wilayah Indonesia. Silakan pilih lokasi di Indonesia.");
      setGeocodingSuccess(null);
      return;
    }

    setIsReverseGeocoding(true);
    setGeocodingError(null);
    setGeocodingSuccess(null);

    try {
      console.log("🗺️ Performing reverse geocoding via API for:", { lat, lng, source });
      
      // Call our API endpoint instead of using the library directly
      const url = new URL("/api/geocoding/reverse", window.location.origin);
      url.searchParams.set("lat", lat.toString());
      url.searchParams.set("lon", lng.toString());
      url.searchParams.set("zoom", "14");

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal mendapatkan data lokasi");
      }

      const locationData = result.data;
      console.log("🗺️ Reverse geocoding success:", locationData);

      // Update form fields with geocoding results
      if (locationData.provinceName && locationData.provinceName !== "Unknown Province") {
        form.setValue("provinceName", locationData.provinceName);
      }
      
      if (locationData.regencyName && locationData.regencyName !== "Unknown Regency") {
        form.setValue("regencyName", locationData.regencyName);
      }
      
      if (locationData.districtName && locationData.districtName !== "Unknown District") {
        form.setValue("districtName", locationData.districtName);
      }
      
      if (locationData.fullAddress) {
        form.setValue("fullAddress", locationData.fullAddress);
      }

      // Update coordinates if they came from geocoding (to ensure precision)
      form.setValue("latitude", locationData.latitude);
      form.setValue("longitude", locationData.longitude);

      // Update last geocoded coordinates
      setLastGeocodedCoords({ lat: locationData.latitude, lng: locationData.longitude });
      
      // Show success message
      setGeocodingSuccess(`${locationData.provinceName} • ${locationData.regencyName} • ${locationData.districtName}`);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setGeocodingSuccess(null), 3000);

    } catch (error) {
      console.error("🗺️ Reverse geocoding error:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mendapatkan data lokasi";
      setGeocodingError(errorMessage);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setGeocodingError(null), 5000);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [form, lastGeocodedCoords]);

  // Debounced reverse geocoding for coordinate input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (latitude && longitude && latitude !== 0 && longitude !== 0) {
        performReverseGeocoding(latitude, longitude, 'input');
      }
    }, 1000); // 1 second delay to avoid too many API calls while typing

    return () => clearTimeout(timeoutId);
  }, [latitude, longitude, performReverseGeocoding]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeocodingError("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    setIsGeolocating(true);
    setGeocodingError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        console.log("🗺️ Current location obtained:", { latitude, longitude });
        
        // Update coordinates first
        form.setValue("latitude", latitude);
        form.setValue("longitude", longitude);
        setMapCenter({ lat: latitude, lng: longitude });

        // Perform reverse geocoding
        await performReverseGeocoding(latitude, longitude, 'geolocation');
        
        setIsGeolocating(false);
      },
      (error) => {
        console.error("🗺️ Geolocation error:", error);
        let errorMessage = "Gagal mendapatkan lokasi saat ini";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Lokasi tidak tersedia. Silakan coba lagi nanti.";
            break;
          case error.TIMEOUT:
            errorMessage = "Waktu tunggu habis. Silakan coba lagi.";
            break;
        }
        
        setGeocodingError(errorMessage);
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [form, performReverseGeocoding]);

  // Handle position change from map
  const handlePositionChange = useCallback(async (position: { lat: number; lng: number }) => {
    console.log("🗺️ Map position changed:", position);
    
    // Update coordinates immediately for responsiveness
    form.setValue("latitude", position.lat);
    form.setValue("longitude", position.lng);
    
    // Perform reverse geocoding
    await performReverseGeocoding(position.lat, position.lng, 'map');
  }, [form, performReverseGeocoding]);

  // Handle address change from map (legacy support, but our reverse geocoding is more comprehensive)
  const handleAddressChange = useCallback((addressResult: {
    address: string;
    province: string;
    city: string;
    district: string;
  }) => {
    // This is a fallback in case the map component provides address data
    // Our reverse geocoding should handle this, but we keep it for compatibility
    console.log("🗺️ Map address change (legacy):", addressResult);
  }, []);

  // Manual refresh geocoding
  const refreshGeocode = useCallback(() => {
    if (latitude && longitude) {
      performReverseGeocoding(latitude, longitude, 'input');
    }
  }, [latitude, longitude, performReverseGeocoding]);

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Instructions */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Klik pada peta atau seret marker untuk memilih lokasi yang tepat. Gunakan panel kontrol di bawah untuk pencarian cepat.
          </p>
          
          {isReverseGeocoding && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Menganalisis lokasi dengan OpenStreetMap...</span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="font-semibold text-blue-800 mb-2">📍 Cara Menggunakan Pencarian Lokasi:</div>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Klik langsung pada peta</strong> untuk memilih lokasi</li>
              <li>• <strong>Seret marker merah</strong> untuk memindahkan posisi</li>
              <li>• <strong>Gunakan "Lokasi Saat Ini"</strong> untuk GPS otomatis</li>
              <li>• <strong>Masukkan koordinat manual</strong> lalu klik "Terapkan Koordinat"</li>
              <li>• <strong>Field provinsi, kabupaten, kecamatan & alamat</strong> akan terisi otomatis</li>
              <li>• <strong>Data diperoleh dari OpenStreetMap Indonesia</strong> 🇮🇩</li>
            </ul>
          </div>
        </div>

        {/* Interactive Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pilih Lokasi di Peta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Map Container - Display First */}
            <div className="h-96 rounded-lg overflow-hidden border shadow-lg bg-gray-100">
              <InteractiveLeafletMap
                center={mapCenter}
                zoom={15}
                onPositionChange={handlePositionChange}
                onAddressChange={handleAddressChange}
                className="h-full w-full"
                draggableMarker={true}
                clickableMap={true}
              />
            </div>

            {/* Map Location Picker - Control Panel Below Map */}
            <MapLocationPicker
              onLocationSelect={(locationData) => {
                console.log("🗺️ Location selected from picker:", locationData);
                
                // Update coordinates first
                form.setValue("latitude", locationData.latitude);
                form.setValue("longitude", locationData.longitude);
                
                // Update map center
                setMapCenter({ lat: locationData.latitude, lng: locationData.longitude });
                
                // Update all location fields in Informasi Lokasi section
                if (locationData.provinceName && locationData.provinceName !== "Unknown Province") {
                  form.setValue("provinceName", locationData.provinceName);
                }
                
                if (locationData.regencyName && locationData.regencyName !== "Unknown Regency") {
                  form.setValue("regencyName", locationData.regencyName);
                }
                
                if (locationData.districtName && locationData.districtName !== "Unknown District") {
                  form.setValue("districtName", locationData.districtName);
                }
                
                if (locationData.fullAddress) {
                  form.setValue("fullAddress", locationData.fullAddress);
                }
                
                // Update geocoded coordinates tracking
                setLastGeocodedCoords({ lat: locationData.latitude, lng: locationData.longitude });
                
                // Show success message with complete info
                setGeocodingSuccess(`${locationData.provinceName} • ${locationData.regencyName} • ${locationData.districtName}`);
                setTimeout(() => setGeocodingSuccess(null), 4000);
                
                // Clear any previous errors
                setGeocodingError(null);
              }}
              currentLocation={{
                latitude: latitude || -6.2088,
                longitude: longitude || 106.8456
              }}
              disabled={isReverseGeocoding}
            />
            
            
          </CardContent>
        </Card>

        {/* Location Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informasi Lokasi</span>
              <div className="flex items-center gap-2">
                {isReverseGeocoding && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Mengisi otomatis...</span>
                  </div>
                )}
                {geocodingSuccess && !isReverseGeocoding && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Terisi otomatis</span>
                  </div>
                )}
                {/* Form validation status */}
                <div className={`text-xs px-2 py-1 rounded ${
                  form.formState.isValid 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {form.formState.isValid ? '✓ Valid' : '✗ Invalid'}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location info banner */}
            {geocodingSuccess && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-800 text-sm">Lokasi Terdeteksi dari Peta</div>
                    <div className="text-green-700 text-sm">{geocodingSuccess}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Province, Regency, District */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="provinceName"
                render={({ field }) => {
                  const isAutoFilled = field.value && geocodingSuccess;
                  const isInProvinceList = provinces.includes(field.value || "");
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Provinsi <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        {isInProvinceList || !field.value ? (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={isAutoFilled ? "border-green-200 bg-green-50" : ""}>
                              <SelectValue placeholder="Pilih provinsi" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Nama provinsi"
                              className="border-blue-200 bg-blue-50"
                            />
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="regencyName"
                render={({ field }) => {
                  const isAutoFilled = field.value && geocodingSuccess;
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Kabupaten/Kota <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contoh: Jakarta Selatan" 
                          {...field}
                          className={isAutoFilled ? "border-green-200 bg-green-50" : ""}
                        />
                      </FormControl>
                      {isAutoFilled && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Terisi dari peta</span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="districtName"
                render={({ field }) => {
                  const isAutoFilled = field.value && geocodingSuccess;
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Kecamatan <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contoh: Kebayoran Baru" 
                          {...field}
                          className={isAutoFilled ? "border-green-200 bg-green-50" : ""}
                        />
                      </FormControl>
                      {isAutoFilled && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Terisi dari peta</span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Full Address */}
            <FormField
              control={form.control}
              name="fullAddress"
              render={({ field }) => {
                const isAutoFilled = field.value && geocodingSuccess;
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Alamat Lengkap <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Jl. Sudirman No. 123, RT 01/RW 02, Kebayoran Baru, Jakarta Selatan"
                        rows={3}
                        {...field}
                        className={isAutoFilled ? "border-green-200 bg-green-50" : ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Alamat lengkap termasuk nama jalan, nomor, RT/RW
                      {isAutoFilled && (
                        <span className="text-green-600 font-medium ml-2">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Terisi otomatis dari peta
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Coordinates Section */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">Koordinat Lokasi</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Latitude <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="-6.2088"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Longitude <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="106.8456"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              
              
              <div className="text-center text-xs text-gray-500">
                Masukkan koordinat lalu klik tombol di atas untuk mengisi field lokasi secara otomatis
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-center gap-2">
                {/* Debug button - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("🔧 Manual validation trigger");
                        form.trigger();
                        const values = form.getValues();
                        const errors = form.formState.errors;
                        console.log("Form values:", values);
                        console.log("Form errors:", errors);
                        console.log("Form state:", form.formState);
                      }}
                      className="text-xs"
                    >
                      Debug Validation
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("🚀 Force update step validity");
                        const values = form.getValues();
                        
                        // Check if all required fields are filled
                        const hasAllFields = values.provinceName && 
                                            values.regencyName && 
                                            values.districtName && 
                                            values.fullAddress && 
                                            values.latitude !== undefined && 
                                            values.longitude !== undefined;
                        
                        console.log("Has all required fields:", hasAllFields);
                        console.log("Current values:", values);
                        
                        if (setStepValidity && hasAllFields) {
                          setStepValidity(1, true); // Force set to true
                          console.log("✅ Forced step validity to TRUE");
                        } else {
                          console.log("❌ Missing required fields, cannot force valid");
                        }
                      }}
                      className="text-xs"
                    >
                      Force Valid
                    </Button>
                  </>
                )}
              </div>

              {/* Quick fill for testing */}
              {process.env.NODE_ENV === 'development' && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      console.log("🧪 Filling test data...");
                      
                      // Fill with Jakarta data for testing
                      const testData = {
                        provinceName: "DKI Jakarta",
                        regencyName: "Jakarta Selatan", 
                        districtName: "Setiabudi",
                        fullAddress: "Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta",
                        latitude: -6.2088,
                        longitude: 106.8456
                      };

                      // Set each field individually
                      Object.entries(testData).forEach(([key, value]) => {
                        form.setValue(key as keyof Step2FormData, value, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true
                        });
                      });
                      
                      // Trigger validation after setting values
                      setTimeout(async () => {
                        console.log("🔄 Validating test data...");
                        const isValid = await form.trigger();
                        const values = form.getValues();
                        const errors = form.formState.errors;
                        
                        console.log("Test data validation result:", isValid);
                        console.log("Test values:", values);
                        console.log("Test errors:", errors);
                        
                        // Manual step validity update
                        if (setStepValidity) {
                          setStepValidity(1, isValid);
                        }
                        
                        // Call onDataChange with test data
                        if (isValid) {
                          console.log("📤 Calling onDataChange with test data:", testData);
                          onDataChange(testData);
                        }
                      }, 200);
                    }}
                    className="text-xs text-blue-600"
                  >
                    🧪 Fill Test Data
                  </Button>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {geocodingError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{geocodingError}</AlertDescription>
              </Alert>
            )}

            {geocodingSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{geocodingSuccess}</AlertDescription>
              </Alert>
            )}

            {isReverseGeocoding && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Sedang mendapatkan informasi lokasi...</AlertDescription>
              </Alert>
            )}

            {/* Form Validation Debug - Remove this in production */}
            {process.env.NODE_ENV === 'development' && Object.keys(form.formState.errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-sm">
                    <strong>Form Errors (Debug):</strong>
                    <ul className="mt-1 space-y-1">
                      {Object.entries(form.formState.errors).map(([field, error]) => (
                        <li key={field} className="text-xs">
                          • <strong>{field}:</strong> {error?.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
