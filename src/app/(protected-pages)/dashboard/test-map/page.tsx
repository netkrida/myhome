"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Dynamically import the map component
const InteractiveLeafletMap = dynamic(() => import("@/components/maps/interactive-leaflet-map").then(mod => ({ default: mod.InteractiveLeafletMap })), { 
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center bg-muted/50 rounded-lg">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-2" />
        <div className="text-sm text-muted-foreground">Loading map...</div>
      </div>
    </div>
  ),
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

export default function TestMapPage() {
  const [mapPosition, setMapPosition] = useState<MapPosition>({
    lat: -6.2088, // Jakarta
    lng: 106.8456,
  });
  const [addressResult, setAddressResult] = useState<ReverseGeocodeResult | null>(null);

  const handlePositionChange = (position: MapPosition) => {
    setMapPosition(position);
    console.log("Position changed:", position);
  };

  const handleAddressChange = (address: ReverseGeocodeResult) => {
    setAddressResult(address);
    console.log("Address changed:", address);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Map Component Test</h1>
        <p className="text-muted-foreground">
          Test the interactive Leaflet map component with reverse geocoding
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Map</CardTitle>
            <CardDescription>
              Click on the map or drag the marker to test functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveLeafletMap
              center={mapPosition}
              zoom={15}
              onPositionChange={handlePositionChange}
              onAddressChange={handleAddressChange}
              height="400px"
              className="rounded-lg border"
              draggableMarker={true}
              clickableMap={true}
            />
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Current position and reverse geocoded address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Position</h4>
              <div className="text-sm space-y-1">
                <div>Latitude: {mapPosition.lat.toFixed(6)}</div>
                <div>Longitude: {mapPosition.lng.toFixed(6)}</div>
              </div>
            </div>

            {addressResult && (
              <div>
                <h4 className="font-semibold mb-2">Address</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Full Address:</strong> {addressResult.address}</div>
                  <div><strong>Province:</strong> {addressResult.province}</div>
                  <div><strong>City:</strong> {addressResult.city}</div>
                  <div><strong>District:</strong> {addressResult.district}</div>
                </div>
              </div>
            )}

            {!addressResult && (
              <div className="text-sm text-muted-foreground">
                Click on the map to get address information
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
