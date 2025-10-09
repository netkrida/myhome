"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyCardData {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
  mainImageUrl: string | null;
}

interface PropertySliderProps {
  properties: PropertyCardData[];
  selectedPropertyId: string | null;
  onPropertySelect: (propertyId: string | null) => void;
  isLoading?: boolean;
}

export function PropertySlider({
  properties,
  selectedPropertyId,
  onPropertySelect,
  isLoading = false,
}: PropertySliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [properties]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="flex-shrink-0 w-64 rounded-2xl">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const occupiedRooms = (property: PropertyCardData) =>
    property.totalRooms - property.availableRooms;

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Slider Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* All Properties Card */}
        <Card
          className={cn(
            "flex-shrink-0 w-64 rounded-2xl cursor-pointer transition-all duration-300 snap-start",
            "hover:shadow-lg hover:scale-[1.02]",
            selectedPropertyId === null
              ? "ring-2 ring-primary shadow-lg"
              : "hover:ring-1 hover:ring-border"
          )}
          onClick={() => onPropertySelect(null)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">
                  Semua Properti
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {properties.length} properti
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {properties.reduce((sum, p) => sum + p.totalRooms, 0)} kamar
                  </Badge>
                  <Badge variant="outline" className="text-xs text-emerald-600">
                    {properties.reduce((sum, p) => sum + p.availableRooms, 0)}{" "}
                    tersedia
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Cards */}
        {properties.map((property) => (
          <Card
            key={property.id}
            className={cn(
              "flex-shrink-0 w-64 rounded-2xl cursor-pointer transition-all duration-300 snap-start",
              "hover:shadow-lg hover:scale-[1.02]",
              selectedPropertyId === property.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:ring-1 hover:ring-border"
            )}
            onClick={() => onPropertySelect(property.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {property.mainImageUrl ? (
                  <img
                    src={property.mainImageUrl}
                    alt={property.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 truncate">
                    {property.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {property.totalRooms} kamar total
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {property.availableRooms} tersedia
                    </Badge>
                    <Badge variant="outline" className="text-xs text-indigo-600">
                      {occupiedRooms(property)} terisi
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        property.occupancyRate >= 80
                          ? "text-emerald-600"
                          : property.occupancyRate >= 50
                          ? "text-amber-600"
                          : "text-slate-600"
                      )}
                    >
                      {property.occupancyRate}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

