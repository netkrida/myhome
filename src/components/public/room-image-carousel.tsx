"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PropertyImageDTO } from "@/server/types/property";
import { cn } from "@/lib/utils";

interface RoomImageCarouselProps {
  images: PropertyImageDTO[];
  roomType: string;
  propertyName: string;
  className?: string;
}

export function RoomImageCarousel({
  images,
  roomType,
  propertyName,
  className
}: RoomImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedImages.length === 0) {
    return (
      <div className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted",
        className
      )}>
        <BedDouble className="h-10 w-10 text-muted-foreground/40" />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const currentImage = sortedImages[currentIndex];

  if (!currentImage) {
    return null;
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm", className)}>
      {/* Main Image */}
      <div className="relative h-full w-full">
        <Image
          src={currentImage.imageUrl}
          alt={currentImage.caption ?? `${roomType} - ${propertyName}`}
          fill
          sizes="(min-width: 1024px) 260px, 50vw"
          className="object-cover transition duration-500"
        />
      </div>

      {/* Navigation Buttons - Show on hover for desktop, always show for mobile */}
      {sortedImages.length > 1 && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 md:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous image</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 md:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next image</span>
          </Button>
        </>
      )}

      {/* Image Counter */}
      <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white shadow">
        {currentIndex + 1}/{sortedImages.length}
      </div>

      {/* Dot Indicators - Show at bottom */}
      {sortedImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                index === currentIndex
                  ? "w-4 bg-white"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
