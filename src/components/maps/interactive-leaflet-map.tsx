"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPosition {
  lat: number;
  lng: number;
}

interface ReverseGeocodeResult {
  address: string;
  province: string;
  city: string;
  district: string;
}

interface InteractiveLeafletMapProps {
  center: MapPosition;
  zoom?: number;
  onPositionChange?: (position: MapPosition) => void;
  onAddressChange?: (address: ReverseGeocodeResult) => void;
  className?: string;
  height?: string;
  draggableMarker?: boolean;
  clickableMap?: boolean;
}

export function InteractiveLeafletMap({
  center,
  zoom = 15,
  onPositionChange,
  onAddressChange,
  className = "",
  height = "400px",
  draggableMarker = true,
  clickableMap = true,
}: InteractiveLeafletMapProps) {
  // Provide default center coordinates (Jakarta, Indonesia) if center is invalid
  const validCenter = {
    lat: center?.lat && !isNaN(center.lat) ? center.lat : -6.2088,
    lng: center?.lng && !isNaN(center.lng) ? center.lng : 106.8456
  };
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    setIsGeocodingLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=id&accept-language=id,en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        
        // Build full address string
        const addressParts = [
          address.house_number,
          address.road || address.street,
          address.neighbourhood || address.suburb,
          address.village || address.town || address.city_district,
        ].filter(Boolean);
        
        const fullAddress = addressParts.join(', ');
        
        const result: ReverseGeocodeResult = {
          address: fullAddress || data.display_name || '',
          province: address.state || address.province || '',
          city: address.city || address.town || address.county || '',
          district: address.city_district || address.suburb || address.neighbourhood || '',
        };
        
        return result;
      }
      
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setError("Failed to get address from coordinates");
      return null;
    } finally {
      setIsGeocodingLoading(false);
    }
  }, []);

  // Handle position change
  const handlePositionChange = useCallback(async (newPosition: MapPosition) => {
    onPositionChange?.(newPosition);
    
    if (onAddressChange) {
      const addressResult = await reverseGeocode(newPosition.lat, newPosition.lng);
      if (addressResult) {
        onAddressChange(addressResult);
      }
    }
  }, [onPositionChange, onAddressChange, reverseGeocode]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [validCenter.lat, validCenter.lng],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
      });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker([validCenter.lat, validCenter.lng], {
        draggable: draggableMarker,
      }).addTo(map);

      // Handle marker drag
      if (draggableMarker) {
        marker.on('dragend', (e) => {
          const position = e.target.getLatLng();
          handlePositionChange({ lat: position.lat, lng: position.lng });
        });
      }

      // Handle map click
      if (clickableMap) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          handlePositionChange({ lat, lng });
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setIsLoading(false);
      setError(null);

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        }
      };
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("Failed to initialize map");
      setIsLoading(false);
    }
  }, [validCenter.lat, validCenter.lng, zoom, draggableMarker, clickableMap, handlePositionChange]);

  // Update marker position when center changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newLatLng = L.latLng(validCenter.lat, validCenter.lng);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, zoom);
    }
  }, [validCenter.lat, validCenter.lng, zoom]);

  if (error) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-2" />
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        </div>
      )}
      
      {isGeocodingLoading && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-[1000] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Getting address...</span>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-700">
            {draggableMarker && clickableMap ? (
              <>Click on the map or drag the marker to select location</>
            ) : clickableMap ? (
              <>Click on the map to select location</>
            ) : draggableMarker ? (
              <>Drag the marker to select location</>
            ) : (
              <>View location on map</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
