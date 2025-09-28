import { useState } from "react";

/**
 * Geocoding utilities for client-side usage
 * Provides functions to interact with reverse geocoding API
 */

export interface LocationData {
  provinceName: string;
  regencyName: string;
  districtName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  provinceCode?: string;
  regencyCode?: string;
  districtCode?: string;
  osmData?: {
    displayName: string;
    addressType: string;
    placeRank: number;
    importance: number;
    boundingBox: string[];
  };
}

export interface ReverseGeocodingResponse {
  success: boolean;
  data?: LocationData;
  error?: string;
  details?: string;
}

export interface MultipleReverseGeocodingResponse {
  success: boolean;
  data?: {
    successful: Array<{
      id?: string;
      input: { lat: number; lon: number; id?: string };
      location: LocationData;
    }>;
    failed: Array<{
      id?: string;
      input: { lat: number; lon: number; id?: string };
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
  error?: string;
  details?: string;
}

/**
 * Melakukan reverse geocoding untuk satu koordinat
 * @param lat Latitude
 * @param lon Longitude
 * @param zoom Level zoom (optional, default: 10)
 * @returns Promise dengan data lokasi
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  zoom: number = 10
): Promise<ReverseGeocodingResponse> {
  try {
    // Validasi input
    if (lat < -90 || lat > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }
    if (lon < -180 || lon > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }
    if (zoom < 1 || zoom > 18) {
      throw new Error("Zoom must be between 1 and 18");
    }

    console.log("🌍 Reverse geocoding:", { lat, lon, zoom });

    const url = new URL("/api/geocoding/reverse", window.location.origin);
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lon", lon.toString());
    url.searchParams.set("zoom", zoom.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: ReverseGeocodingResponse = await response.json();
    
    console.log("🌍 Reverse geocoding result:", result);
    
    return result;

  } catch (error) {
    console.error("🌍 Reverse geocoding error:", error);
    
    return {
      success: false,
      error: "Failed to get location data",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Melakukan reverse geocoding untuk multiple koordinat
 * @param coordinates Array koordinat dengan optional ID
 * @param zoom Level zoom (optional, default: 10)
 * @returns Promise dengan data lokasi multiple
 */
export async function reverseGeocodeMultiple(
  coordinates: Array<{ lat: number; lon: number; id?: string }>,
  zoom: number = 10
): Promise<MultipleReverseGeocodingResponse> {
  try {
    // Validasi input
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error("Coordinates array is required and cannot be empty");
    }
    if (coordinates.length > 10) {
      throw new Error("Maximum 10 coordinates allowed per request");
    }
    
    // Validasi setiap koordinat
    for (const coord of coordinates) {
      if (coord.lat < -90 || coord.lat > 90) {
        throw new Error(`Invalid latitude: ${coord.lat}. Must be between -90 and 90`);
      }
      if (coord.lon < -180 || coord.lon > 180) {
        throw new Error(`Invalid longitude: ${coord.lon}. Must be between -180 and 180`);
      }
    }

    if (zoom < 1 || zoom > 18) {
      throw new Error("Zoom must be between 1 and 18");
    }

    console.log("🌍 Multiple reverse geocoding:", { coordinates, zoom });

    const response = await fetch("/api/geocoding/reverse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates,
        zoom
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: MultipleReverseGeocodingResponse = await response.json();
    
    console.log("🌍 Multiple reverse geocoding result:", result);
    
    return result;

  } catch (error) {
    console.error("🌍 Multiple reverse geocoding error:", error);
    
    return {
      success: false,
      error: "Failed to get location data for multiple coordinates",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Fungsi helper untuk format alamat yang user-friendly
 * @param locationData Data lokasi dari reverse geocoding
 * @returns String alamat yang diformat
 */
export function formatAddress(locationData: LocationData): string {
  const parts = [
    locationData.districtName,
    locationData.regencyName,
    locationData.provinceName
  ].filter(part => part && part !== "Unknown District" && part !== "Unknown Regency" && part !== "Unknown Province");
  
  return parts.join(", ") || locationData.fullAddress;
}

/**
 * Fungsi helper untuk mendapatkan alamat singkat
 * @param locationData Data lokasi dari reverse geocoding
 * @returns String alamat singkat
 */
export function getShortAddress(locationData: LocationData): string {
  const parts = [
    locationData.districtName !== "Unknown District" ? locationData.districtName : null,
    locationData.regencyName !== "Unknown Regency" ? locationData.regencyName : null
  ].filter(Boolean);
  
  return parts.join(", ") || locationData.provinceName;
}

/**
 * Fungsi helper untuk validasi apakah koordinat berada di Indonesia
 * @param lat Latitude
 * @param lon Longitude
 * @returns Boolean apakah koordinat di Indonesia
 */
export function isCoordinateInIndonesia(lat: number, lon: number): boolean {
  // Bounding box Indonesia (approximate)
  const INDONESIA_BOUNDS = {
    north: 6.5,      // Sabang
    south: -11.2,    // Rote Island
    east: 141.5,     // Merauke
    west: 94.5       // Banda Aceh
  };
  
  return (
    lat >= INDONESIA_BOUNDS.south &&
    lat <= INDONESIA_BOUNDS.north &&
    lon >= INDONESIA_BOUNDS.west &&
    lon <= INDONESIA_BOUNDS.east
  );
}

/**
 * Fungsi helper untuk mendapatkan level zoom yang sesuai berdasarkan jarak
 * @param distance Jarak dalam meter
 * @returns Level zoom yang sesuai
 */
export function getZoomLevelByDistance(distance: number): number {
  if (distance <= 100) return 18;      // Sangat dekat - level bangunan
  if (distance <= 500) return 16;      // Dekat - level jalan
  if (distance <= 1000) return 14;     // Sedang - level kelurahan
  if (distance <= 5000) return 12;     // Jauh - level kecamatan
  if (distance <= 10000) return 10;    // Sangat jauh - level kabupaten
  return 8;                            // Default - level provinsi
}

/**
 * Hook untuk menggunakan reverse geocoding dengan React
 * Hanya untuk referensi - implementasi sebenarnya tergantung framework yang digunakan
 */
export function useReverseGeocoding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const geocode = async (lat: number, lon: number, zoom?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await reverseGeocode(lat, lon, zoom);
      
      if (!result.success) {
        setError(result.error || "Failed to get location data");
        return null;
      }
      
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    geocode,
    isLoading,
    error
  };
}

// Export untuk backward compatibility
export default {
  reverseGeocode,
  reverseGeocodeMultiple,
  formatAddress,
  getShortAddress,
  isCoordinateInIndonesia,
  getZoomLevelByDistance
};