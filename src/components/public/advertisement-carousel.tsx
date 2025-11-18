"use client";

import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

export function AdvertisementCarousel() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

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
    try {
      const response = await fetch("/api/public/iklan");
      const result = await response.json();

      if (result.success && result.data) {
        setAdvertisements(result.data);
      }
    } catch (error) {
      console.error("Error fetching advertisements:", error);
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
    return (
      <div className="w-full aspect-[16/6] bg-muted rounded-lg animate-pulse" />
    );
  }

  if (advertisements.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Carousel */}
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {advertisements.map((ad) => (
            <div
              key={ad.id}
              className="flex-[0_0_100%] min-w-0 relative aspect-[16/6]"
            >
              {ad.linkUrl ? (
                <a
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative w-full h-full"
                >
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    priority={advertisements.indexOf(ad) === 0}
                    unoptimized
                  />
                  {/* Overlay with description only */}
                  {ad.description && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                      <div className="p-6 md:p-8 text-white max-w-2xl">
                        <p className="text-sm md:text-base text-white/90">
                          {ad.description}
                        </p>
                      </div>
                    </div>
                  )}
                </a>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    priority={advertisements.indexOf(ad) === 0}
                    unoptimized
                  />
                  {/* Overlay with description only */}
                  {ad.description && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                      <div className="p-6 md:p-8 text-white max-w-2xl">
                        <p className="text-sm md:text-base text-white/90">
                          {ad.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator dihilangkan */}
    </div>
  );
}
