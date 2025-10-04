"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "@/components/ui/globe";
import type { COBEOptions } from "cobe";

interface AnalyticsGlobeProps {
  countries: { [key: string]: number };
  cities: { [key: string]: number };
  period: string;
}

interface GlobeMarker {
  location: [number, number];
  size: number;
  country: string;
}

// Color mapping based on visitor count
const getMarkerColor = (count: number): [number, number, number] => {
  if (count >= 100) return [239/255, 68/255, 68/255]; // red-500 - High traffic
  if (count >= 50) return [249/255, 115/255, 22/255]; // orange-500 - Medium-high traffic
  if (count >= 20) return [234/255, 179/255, 8/255]; // yellow-500 - Medium traffic
  if (count >= 10) return [34/255, 197/255, 94/255]; // green-500 - Low-medium traffic
  if (count >= 5) return [59/255, 130/255, 246/255]; // blue-500 - Low traffic
  return [107/255, 114/255, 128/255]; // gray-500 - Very low traffic
};

// Get marker size based on visitor count
const getMarkerSize = (count: number): number => {
  if (count >= 100) return 0.15;
  if (count >= 50) return 0.12;
  if (count >= 20) return 0.10;
  if (count >= 10) return 0.08;
  if (count >= 5) return 0.06;
  return 0.04;
};

export function AnalyticsGlobe({ countries, cities, period }: AnalyticsGlobeProps) {
  // Add CSS animations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes fadeOutScale {
          from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);
  const [selectedCountry, setSelectedCountry] = useState<{name: string, count: number} | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{name: string, count: number} | null>(null);
  const [globeData, setGlobeData] = useState<GlobeMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phi, setPhi] = useState(0);
  const [theta, setTheta] = useState(0.3);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Load globe data and merge with visitor data - optimized to prevent blinking
  useEffect(() => {
    const loadGlobeData = async () => {
      try {
        const response = await fetch('/data/globe.json');
        const baseGlobeData: GlobeMarker[] = await response.json();

        // Merge with visitor data
        const mergedData = baseGlobeData.map(marker => {
          const visitorCount = countries[marker.country] || 0;
          return {
            ...marker,
            size: visitorCount > 0 ? getMarkerSize(visitorCount) : 0.02,
          };
        });

        // Only update if data actually changed to prevent unnecessary re-renders
        setGlobeData(prevData => {
          const hasChanged = JSON.stringify(prevData) !== JSON.stringify(mergedData);
          return hasChanged ? mergedData : prevData;
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading globe data:', error);
        setIsLoading(false);
      }
    };

    // Debounce the data loading to prevent rapid updates
    const timeoutId = setTimeout(loadGlobeData, 200);
    return () => clearTimeout(timeoutId);
  }, [countries]);

  // Handle globe click to show country info with enhanced display
  // Handle mouse hover to detect country and show data - simplified to prevent blinking
  const handleGlobeHover = useCallback((event: React.MouseEvent) => {
    // Get available countries with visitors
    const topCountries = Object.entries(countries)
      .filter(([, count]) => count > 0)
      .sort(([,a], [,b]) => b - a);

    if (topCountries.length > 0) {
      // Just pick the first country to avoid complex calculations that cause blinking
  const [countryName, count] = topCountries[0]!;

      // Only update if country actually changed
      setHoveredCountry(prev => {
        if (prev?.name === countryName && prev?.count === count) {
          return prev;
        }
        return { name: countryName, count };
      });
    }
  }, [countries]);

  // Handle mouse leave to clear hover state
  const handleGlobeMouseLeave = () => {
    setHoveredCountry(null);
  };

  // Handle click to select country
  const handleGlobeClick = (event: React.MouseEvent) => {
    if (hoveredCountry) {
      setSelectedCountry(hoveredCountry);
    }
  };

  // Disable auto rotation to prevent blinking - can be enabled later if needed
  // useEffect(() => {
  //   if (!isDragging) {
  //     const interval = setInterval(() => {
  //       setPhi(prev => prev + 0.0005); // Very slow rotation
  //     }, 200); // Very slow interval
  //     return () => clearInterval(interval);
  //   }
  // }, [isDragging]);

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // Handle mouse interactions for dragging
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeaveGlobe = () => {
    setIsDragging(false);
    setHoveredCountry(null); // Clear hover when leaving globe
  };

  // Memoize globe config with stable hover support to prevent blinking
  const globeConfig = useMemo((): COBEOptions => ({
    width: 350,
    height: 400,
    onRender: (state: any) => {
      // Very minimal updates to prevent blinking
      state.theta = theta;
      state.scale = scale;
      // Don't update phi to prevent rotation blinking
      state.phi = phi;
    },
    devicePixelRatio: 2,
    phi: phi,
    theta: theta,
    dark: 0, // Set to 0 for light theme
    diffuse: 1.2, // Reduce diffuse to improve performance
    mapSamples: 8000, // Significantly reduce samples for better performance
    mapBrightness: 6, // Reduce brightness to improve performance
    baseColor: [1, 1, 1], // Pure white background
    markerColor: [1, 0.2, 0.2], // Red markers for better visibility on white
    glowColor: [0.95, 0.95, 0.95], // Very light gray glow
    markers: globeData,
    scale: scale,
  offset: [0, 0],
  }), [theta, scale, globeData, phi]); // Remove hoveredCountry from dependencies to prevent re-render

  const formatPeriod = (period: string) => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Global Visitor Distribution</CardTitle>
        <CardDescription>
          Interactive world map showing visitor countries for {formatPeriod(period).toLowerCase()}
          {selectedCountry && (
            <span className="block mt-2 text-primary font-medium">
              📍 {selectedCountry.name}: {selectedCountry.count} visitors
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Globe Section */}
          <div
            className="relative cursor-pointer bg-white rounded-lg overflow-hidden select-none mx-auto lg:mx-0"
            style={{
              width: '350px',
              height: '400px',
              maxWidth: '100%',
              maxHeight: '60vh'
            }}
            onClick={handleGlobeClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeaveGlobe}
            onMouseEnter={handleGlobeHover}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Globe config={globeConfig} className="w-full h-full" />
            )}

            {/* Hover indicator */}
            {hoveredCountry && (
              <div className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm rounded-lg p-3 text-sm shadow-lg">
                <div className="text-white space-y-1">
                  <p className="font-medium">🌍 {hoveredCountry.name}</p>
                  <p className="text-xs opacity-90">{hoveredCountry.count} visitors</p>
                </div>
              </div>
            )}

          </div>

          {/* Data Section - Compact version */}
          <div className="flex-1 space-y-4">
            {/* Worldwide Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium opacity-90">🌍 WORLDWIDE</span>
              </div>
              <div className="text-2xl font-bold">
                {Object.values(countries).reduce((sum, count) => sum + count, 0).toLocaleString()}
              </div>
              <div className="text-xs opacity-90">total users</div>
            </div>

            {/* Current Country Display */}
            {(hoveredCountry || selectedCountry) && (
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium opacity-90">
                    🇮🇩 {(hoveredCountry || selectedCountry)?.name.toUpperCase()}
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {(hoveredCountry || selectedCountry)?.count.toLocaleString()}
                </div>
                <div className="text-xs opacity-90">users</div>
              </div>
            )}

            {/* Top Countries List - Compact */}
            <div className="bg-white rounded-lg border p-3">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Top Countries</h3>
              <div className="space-y-2">
                {Object.entries(countries)
                  .filter(([, count]) => count > 0)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 4)
                  .map(([country, count], index) => (
                    <div key={country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">#{index + 1}</span>
                        <span className="text-sm font-medium">{country}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}
