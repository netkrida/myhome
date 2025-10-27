"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import type { PropertySliderItemDTO } from "@/server/types/adminkos";

interface PropertySliderProps {
  properties: PropertySliderItemDTO[];
  selectedPropertyId?: string;
  onPropertySelect: (propertyId: string | undefined) => void;
  isLoading?: boolean;
}

export function PropertySlider({ 
  properties, 
  selectedPropertyId, 
  onPropertySelect, 
  isLoading 
}: PropertySliderProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pilih Properti</h3>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="min-w-[280px]">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex gap-2 mb-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const allProperties = [
    {
      id: "all",
      name: "Semua Properti",
      totalRooms: properties.reduce((sum, p) => sum + p.totalRooms, 0),
      availableRooms: properties.reduce((sum, p) => sum + p.availableRooms, 0),
      occupiedRooms: properties.reduce((sum, p) => sum + p.occupiedRooms, 0),
      occupancyRate: properties.length > 0 
        ? Math.round(properties.reduce((sum, p) => sum + p.occupancyRate, 0) / properties.length)
        : 0,
      mainImageUrl: null,
    },
    ...properties,
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('property-slider');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pilih Properti</h3>
        {allProperties.length > 3 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('left')}
              disabled={scrollPosition === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div 
        id="property-slider"
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allProperties.map((property) => {
          const isSelected = property.id === "all" 
            ? !selectedPropertyId 
            : selectedPropertyId === property.id;

          return (
            <Card 
              key={property.id}
              className={`min-w-[280px] cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onPropertySelect(property.id === "all" ? undefined : property.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${
                    property.id === "all" ? 'bg-blue-100' : 'bg-gray-100'
                  } flex items-center justify-center flex-shrink-0`}>
                    <Building2 className={`h-5 w-5 ${
                      property.id === "all" ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 truncate mb-2">
                      {property.name}
                    </h4>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {property.totalRooms} Total
                      </Badge>
                      <Badge variant="outline" className="text-xs text-emerald-600">
                        {property.availableRooms} Tersedia
                      </Badge>
                      <Badge variant="outline" className="text-xs text-indigo-600">
                        {property.occupiedRooms} Terisi
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Occupancy: {property.occupancyRate}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
