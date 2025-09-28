"use client";

import React, { useState, useCallback, useEffect } from "react";
import { MapPin, Loader2, AlertCircle, Navigation, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { reverseGeocode, formatAddress, getShortAddress, isCoordinateInIndonesia, type LocationData } from "@/lib/geocoding";

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  disabled?: boolean;
  className?: string;
}

export function LocationPicker({
  onLocationSelect,
  initialLocation,
  disabled = false,
  className = ""
}: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState({
    latitude: initialLocation?.latitude || -6.2088,  // Default: Jakarta
    longitude: initialLocation?.longitude || 106.8456
  });
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

  // Function untuk melakukan reverse geocoding
  const handleReverseGeocode = useCallback(async (lat: number, lon: number) => {
    if (disabled) return;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log("🗺️ Starting reverse geocoding for:", { lat, lon });

      // Cek apakah koordinat di Indonesia
      if (!isCoordinateInIndonesia(lat, lon)) {
        throw new Error("Koordinat berada di luar wilayah Indonesia. Silakan pilih lokasi di Indonesia.");
      }

      const result = await reverseGeocode(lat, lon, 12);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal mendapatkan data lokasi");
      }

      const location = result.data;
      console.log("🗺️ Reverse geocoding success:", location);

      setLocationData(location);
      onLocationSelect(location);

    } catch (err) {
      console.error("🗺️ Reverse geocoding error:", err);
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat mendapatkan data lokasi";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, onLocationSelect]);

  // Function untuk mendapatkan lokasi saat ini
  const getCurrentLocation = useCallback(() => {
    if (disabled || !navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    setIsGettingCurrentLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("🗺️ Current location obtained:", { latitude, longitude });
        
        setCoordinates({ latitude, longitude });
        handleReverseGeocode(latitude, longitude);
        setIsGettingCurrentLocation(false);
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
        
        setError(errorMessage);
        setIsGettingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [disabled, handleReverseGeocode]);

  // Function untuk handle input manual koordinat
  const handleCoordinateChange = useCallback((field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setCoordinates(prev => ({
      ...prev,
      [field]: numValue
    }));
  }, []);

  // Function untuk apply koordinat manual
  const applyManualCoordinates = useCallback(() => {
    handleReverseGeocode(coordinates.latitude, coordinates.longitude);
  }, [coordinates, handleReverseGeocode]);

  // Load initial location if provided
  useEffect(() => {
    if (initialLocation && !locationData) {
      handleReverseGeocode(initialLocation.latitude, initialLocation.longitude);
    }
  }, [initialLocation, locationData, handleReverseGeocode]);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pilih Lokasi Property
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Location Button */}
          <div className="flex gap-2">
            <Button
              onClick={getCurrentLocation}
              disabled={disabled || isGettingCurrentLocation || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGettingCurrentLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {isGettingCurrentLocation ? "Mendapatkan Lokasi..." : "Gunakan Lokasi Saat Ini"}
            </Button>
            
            {locationData && (
              <Button
                onClick={() => handleReverseGeocode(coordinates.latitude, coordinates.longitude)}
                disabled={disabled || isLoading}
                variant="outline"
                size="icon"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>

          <Separator />

          {/* Manual Coordinate Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Atau Masukkan Koordinat Manual</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={coordinates.latitude}
                  onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                  disabled={disabled || isLoading}
                  placeholder="-6.2088"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={coordinates.longitude}
                  onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                  disabled={disabled || isLoading}
                  placeholder="106.8456"
                />
              </div>
            </div>
            <Button
              onClick={applyManualCoordinates}
              disabled={disabled || isLoading}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                "Terapkan Koordinat"
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Location Data Display */}
          {locationData && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-green-800">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Lokasi Terdeteksi</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-green-700">Alamat Lengkap:</span>
                    <p className="text-green-600 mt-1">{locationData.fullAddress}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="font-medium text-green-700">Provinsi:</span>
                      <span className="ml-2 text-green-600">{locationData.provinceName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Kabupaten/Kota:</span>
                      <span className="ml-2 text-green-600">{locationData.regencyName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Kecamatan:</span>
                      <span className="ml-2 text-green-600">{locationData.districtName}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-green-500 pt-2 border-t border-green-200">
                    Koordinat: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <div className="font-medium text-blue-700 mb-1">💡 Tips:</div>
            <ul className="space-y-1 text-blue-600">
              <li>• Gunakan "Lokasi Saat Ini" jika Anda berada di lokasi property</li>
              <li>• Koordinat manual berguna jika Anda tahu koordinat exact dari property</li>
              <li>• Pastikan lokasi berada di wilayah Indonesia</li>
              <li>• Data alamat diperoleh dari OpenStreetMap</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LocationPicker;