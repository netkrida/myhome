"use client";

import { useEffect, useState } from "react";
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
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useMultiStepForm } from "@/components/ui/multi-step-form";
import { FormPersistence } from "@/lib/form-persistence";
import { InteractiveLeafletMap } from "@/components/maps/interactive-leaflet-map";
import type { LocationData } from "@/server/types/property";

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
}

// Indonesian provinces (simplified list)
const provinces = [
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "DI Yogyakarta",
  "Banten",
  "Bali",
  "Sumatera Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Kalimantan Timur",
  "Kalimantan Selatan",
  "Sulawesi Selatan",
  "Sulawesi Utara",
];

export function Step2Location({ onDataChange, initialData }: Step2LocationProps) {
  const { setStepValid } = useMultiStepForm();
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]); // Jakarta default
  
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

  const watchedData = form.watch();
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");

  // Validate form and update step validity
  useEffect(() => {
    const isValid = form.formState.isValid;
    setStepValid(1, isValid);
    
    if (isValid) {
      onDataChange(watchedData);
      // Persist form data
      FormPersistence.saveFormData({
        key: "property-creation-step-2",
        useSessionStorage: true,
      }, watchedData);
    }
  }, [watchedData, form.formState.isValid, setStepValid, onDataChange]);

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step2FormData>({
      key: "property-creation-step-2",
      useSessionStorage: true,
    });

    if (persistedData && !initialData) {
      form.reset(persistedData);
      setMapCenter([persistedData.latitude, persistedData.longitude]);
    }
  }, [form, initialData]);

  // Update map center when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("latitude", latitude);
        form.setValue("longitude", longitude);
        setMapCenter([latitude, longitude]);

        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`
          );
          const data = await response.json();
          
          if (data.address) {
            const address = data.address;
            if (address.state) form.setValue("provinceName", address.state);
            if (address.city || address.county) form.setValue("regencyName", address.city || address.county);
            if (address.suburb || address.village) form.setValue("districtName", address.suburb || address.village);
            if (data.display_name) form.setValue("fullAddress", data.display_name);
          }
        } catch (error) {
          console.error("Error getting address:", error);
        }

        setIsGeolocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.");
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);

    // Try to get address from coordinates
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`
      );
      const data = await response.json();
      
      if (data.address) {
        const address = data.address;
        if (address.state && !form.getValues("provinceName")) {
          form.setValue("provinceName", address.state);
        }
        if ((address.city || address.county) && !form.getValues("regencyName")) {
          form.setValue("regencyName", address.city || address.county);
        }
        if ((address.suburb || address.village) && !form.getValues("districtName")) {
          form.setValue("districtName", address.suburb || address.village);
        }
        if (data.display_name && !form.getValues("fullAddress")) {
          form.setValue("fullAddress", data.display_name);
        }
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Location Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Lokasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Province, Regency, District */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="provinceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provinsi <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih provinsi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regencyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kabupaten/Kota <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Jakarta Selatan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="districtName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Kebayoran Baru" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Full Address */}
            <FormField
              control={form.control}
              name="fullAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Jl. Sudirman No. 123, RT 01/RW 02, Kebayoran Baru, Jakarta Selatan"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Alamat lengkap termasuk nama jalan, nomor, RT/RW
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="-6.2088"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel>Longitude <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="106.8456"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Get Current Location Button */}
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGeolocating}
              className="w-full md:w-auto"
            >
              {isGeolocating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {isGeolocating ? "Mendapatkan Lokasi..." : "Gunakan Lokasi Saat Ini"}
            </Button>
          </CardContent>
        </Card>

        {/* Interactive Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pilih Lokasi di Peta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg overflow-hidden border">
              <InteractiveLeafletMap
                center={mapCenter}
                zoom={15}
                onMapClick={handleMapClick}
                markers={[
                  {
                    position: [latitude, longitude],
                    popup: "Lokasi Kos",
                  }
                ]}
                className="h-full w-full"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Klik pada peta untuk memilih lokasi yang tepat. Koordinat akan terisi otomatis.
            </p>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
