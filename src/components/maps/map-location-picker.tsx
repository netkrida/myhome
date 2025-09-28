"use client";

import React, { useState, useCallback } from "react";
import { MapPin, Loader2, Navigation, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { reverseGeocode, isCoordinateInIndonesia, type LocationData } from "@/lib/geocoding";

interface MapLocationPickerProps {
  onLocationSelect: (location: LocationData & { latitude: number; longitude: number }) => void;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  disabled?: boolean;
  className?: string;
}

export function MapLocationPicker({
  onLocationSelect,
  currentLocation,
  disabled = false,
  className = ""
}: MapLocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({
    latitude: currentLocation?.latitude || -6.2088,
    longitude: currentLocation?.longitude || 106.8456
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [locationPreview, setLocationPreview] = useState<LocationData | null>(null);

  // Function untuk reverse geocoding menggunakan API kita
  const performReverseGeocoding = useCallback(async (lat: number, lon: number) => {
    if (disabled) return;
    
    setIsLoading(true);
    
    try {
      // Validasi koordinat Indonesia
      if (!isCoordinateInIndonesia(lat, lon)) {
        throw new Error("Lokasi harus berada di wilayah Indonesia");
      }

      // Call our API endpoint
      const url = new URL("/api/geocoding/reverse", window.location.origin);
      url.searchParams.set("lat", lat.toString());
      url.searchParams.set("lon", lon.toString());
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
      setLocationPreview(locationData);
      
      console.log("🗺️ MapLocationPicker: Sending location data to parent:", {
        ...locationData,
        latitude: lat,
        longitude: lon
      });
      
      // Panggil callback dengan data lengkap
      onLocationSelect({
        ...locationData,
        latitude: lat,
        longitude: lon
      });

    } catch (error) {
      console.error("🗺️ Reverse geocoding error:", error);
      setLocationPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, onLocationSelect]);

  // Function untuk mendapatkan lokasi saat ini
  const getCurrentLocation = useCallback(() => {
    if (disabled || !navigator.geolocation) return;
    
    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        performReverseGeocoding(latitude, longitude);
      },
      (error) => {
        console.error("🗺️ Geolocation error:", error);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [disabled, performReverseGeocoding]);

  // Function untuk apply koordinat manual
  const applyCoordinates = useCallback(() => {
    performReverseGeocoding(coordinates.latitude, coordinates.longitude);
  }, [coordinates, performReverseGeocoding]);

  // Function untuk handle perubahan input koordinat
  const handleCoordinateChange = useCallback((field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setCoordinates(prev => ({
      ...prev,
      [field]: numValue
    }));
  }, []);

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header dengan status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">Pencari Lokasi</span>
            {isLoading && <Badge variant="secondary" className="text-xs">Memproses...</Badge>}
          </div>
          
          {locationPreview && (
            <Badge variant="outline" className="text-xs">
              {locationPreview.districtName}, {locationPreview.regencyName}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={getCurrentLocation}
            disabled={disabled || isLoading}
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3" />
            )}
            Lokasi Saat Ini
          </Button>
          
          <Button
            onClick={applyCoordinates}
            disabled={disabled || isLoading}
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 text-xs"
          >
            <Target className="h-3 w-3" />
            Terapkan Koordinat
          </Button>
        </div>

        {/* Coordinate Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              step="any"
              value={coordinates.latitude}
              onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
              disabled={disabled || isLoading}
              placeholder="Latitude"
              className="text-xs h-8"
            />
          </div>
          <div>
            <Input
              type="number"
              step="any"
              value={coordinates.longitude}
              onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
              disabled={disabled || isLoading}
              placeholder="Longitude"
              className="text-xs h-8"
            />
          </div>
        </div>

        {/* Location Preview */}
        {locationPreview && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
            <div className="text-xs font-medium text-green-800">
              📍 Lokasi Terdeteksi
            </div>
            <div className="text-xs text-green-700">
              <div><strong>Provinsi:</strong> {locationPreview.provinceName}</div>
              <div><strong>Kabupaten/Kota:</strong> {locationPreview.regencyName}</div>
              <div><strong>Kecamatan:</strong> {locationPreview.districtName}</div>
            </div>
            <div className="text-xs text-green-600 truncate">
              {locationPreview.fullAddress}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!locationPreview && !isLoading && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            Klik "Lokasi Saat Ini" atau masukkan koordinat, lalu klik "Terapkan Koordinat"
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MapLocationPicker;