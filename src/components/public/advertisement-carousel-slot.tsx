"use client";

import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { getCloudinaryUrl } from "@/lib/cloudinary-utils";

interface PublicAdvertisement {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  publicId: string | null;
  linkUrl: string | null;
  sortOrder: number;
}

interface AdvertisementCarouselSlotProps {
  layoutSlot: number;
  autoplayDelay?: number;
  className?: string;
  variant?: "large" | "compact";
  showPreview?: boolean;
  infiniteScroll?: boolean;
}

export function AdvertisementCarouselSlot({
  layoutSlot,
  autoplayDelay = 5000,
  className,
  variant = "large",
  showPreview = false,
  infiniteScroll = false,
}: AdvertisementCarouselSlotProps) {
  const [advertisements, setAdvertisements] = useState<PublicAdvertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const slideSize = showPreview ? "85%" : "100%";
  const slideGap = showPreview ? "1rem" : "0";

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start",
      slidesToScroll: 1,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    fetchAdvertisements();
  }, [layoutSlot]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const fetchAdvertisements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/public/iklan?slot=${layoutSlot}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAdvertisements(result.data);
      }
    } catch (error) {
      console.error(`Error fetching advertisements for slot ${layoutSlot}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (isLoading) {
    const aspectRatio = variant === "compact" ? "aspect-[9/2]" : "aspect-[16/6]";
    return (
      <div className={cn("w-full bg-muted rounded-lg animate-pulse", aspectRatio, className)} />
    );
  }

  if (advertisements.length === 0) {
    return null;
  }

  const handleAdClick = (ad: PublicAdvertisement) => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  const aspectRatio = variant === "compact" ? "aspect-[9/2]" : "aspect-[16/6]";
  const titleSize = variant === "compact" ? "text-sm" : "text-2xl";
  const padding = variant === "compact" ? "p-2" : "p-6";

  return (
    <div className={cn("relative", className)}>
      {/* Carousel */}
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex" style={{ gap: slideGap }}>
          {advertisements.map((ad) => {
            const imageUrl = ad.publicId ? getCloudinaryUrl(ad.publicId) : ad.imageUrl;

            return (
              <div
                key={ad.id}
                className={cn(
                  "min-w-0 relative",
                  aspectRatio
                )}
                style={{ flex: `0 0 ${slideSize}` }}
              >
                <div
                  className={cn(
                    "relative w-full h-full group rounded-lg overflow-hidden",
                    ad.linkUrl && "cursor-pointer"
                  )}
                  onClick={() => handleAdClick(ad)}
                >
                  <Image
                    src={imageUrl}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    priority={selectedIndex === 0}
                    unoptimized
                  />
                  {/* Overlay on hover */}
                  {ad.linkUrl && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  {/* Title overlay */}
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent",
                    padding
                  )}>
                    {/* Title removed for public display */}
                    {ad.description && variant === "large" && (
                      <p className="text-white/90 text-sm line-clamp-2">{ad.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows - Hidden for infinite scroll */}
      {/* Navigation arrows removed for public display */}

      {/* Dots - Hidden for infinite scroll */}
      {advertisements.length > 1 && !infiniteScroll && (
        <div className="flex justify-center gap-2 mt-4">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === selectedIndex
                  ? "bg-primary w-8"
                  : "bg-primary/30 hover:bg-primary/50"
              )}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
