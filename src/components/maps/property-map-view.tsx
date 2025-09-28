"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PropertyCoordinate } from "@/server/types";
import { PropertyType } from "@/server/types/property";

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Color configuration for different property types
const PROPERTY_TYPE_COLORS = {
  [PropertyType.MALE_ONLY]: '#3B82F6', // Blue
  [PropertyType.FEMALE_ONLY]: '#EC4899', // Pink
  [PropertyType.MIXED]: '#8B5CF6', // Purple
} as const;

// Create custom colored marker icons
const createColoredMarkerIcon = (color: string): L.DivIcon => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
  });
};

interface PropertyMapViewProps {
  properties: PropertyCoordinate[];
  className?: string;
  height?: string;
  onPropertyClick?: (property: PropertyCoordinate) => void;
  loading?: boolean;
  error?: string | null;
}

const getPropertyTypeLabel = (type: PropertyType): string => {
  switch (type) {
    case PropertyType.MALE_ONLY:
      return "Kos Putra";
    case PropertyType.FEMALE_ONLY:
      return "Kos Putri";
    case PropertyType.MIXED:
      return "Kos Campur";
    default:
      return "Kos";
  }
};

const getPropertyTypeColor = (type: PropertyType): string => {
  switch (type) {
    case PropertyType.MALE_ONLY:
      return "bg-blue-100 text-blue-800";
    case PropertyType.FEMALE_ONLY:
      return "bg-pink-100 text-pink-800";
    case PropertyType.MIXED:
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function PropertyMapView({
  properties,
  className = "",
  height = "500px",
  onPropertyClick,
  loading = false,
  error = null,
}: PropertyMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Default center (Jakarta, Indonesia)
      const defaultCenter: [number, number] = [-6.2088, 106.8456];
      
      // Initialize map
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 10,
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

      mapInstanceRef.current = map;
      setIsMapLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsMapLoading(false);
    }
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    if (properties.length === 0) return;

    // Add new markers
    const newMarkers: L.Marker[] = [];
    const bounds = L.latLngBounds([]);

    properties.forEach(property => {
      if (!property.latitude || !property.longitude) return;

      // Get the color for this property type
      const markerColor = PROPERTY_TYPE_COLORS[property.propertyType];
      const customIcon = createColoredMarkerIcon(markerColor);

      const marker = L.marker([property.latitude, property.longitude], { icon: customIcon })
        .addTo(mapInstanceRef.current!);

      // Create popup content
      const popupContent = `
        <div class="p-3 min-w-[250px]">
          ${property.mainImage ? `
            <img 
              src="${property.mainImage}" 
              alt="${property.name}"
              class="w-full h-32 object-cover rounded-lg mb-3"
              onerror="this.style.display='none'"
            />
          ` : ''}
          <h3 class="font-semibold text-lg mb-2 text-gray-900">${property.name}</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              ${property.location.districtName}, ${property.location.regencyName}
            </div>
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <span>${property.totalRooms} kamar</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>${property.availableRooms} tersedia</span>
              </div>
            </div>
            <div class="mt-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPropertyTypeColor(property.propertyType)}">
                ${getPropertyTypeLabel(property.propertyType)}
              </span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'property-popup'
      });

      // Handle property click - only show popup, don't navigate
      // The popup will be shown automatically by Leaflet when marker is clicked

      newMarkers.push(marker);
      bounds.extend([property.latitude, property.longitude]);
    });

    markersRef.current = newMarkers;

    // Fit map to show all markers
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [properties, loading]);



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
      {(loading || isMapLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-2" />
            <div className="text-sm text-muted-foreground">
              {loading ? "Loading properties..." : "Loading map..."}
            </div>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: PROPERTY_TYPE_COLORS[PropertyType.MALE_ONLY] }}
            ></div>
            <span>Kos Putra</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: PROPERTY_TYPE_COLORS[PropertyType.FEMALE_ONLY] }}
            ></div>
            <span>Kos Putri</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: PROPERTY_TYPE_COLORS[PropertyType.MIXED] }}
            ></div>
            <span>Kos Campur</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyMapView;
