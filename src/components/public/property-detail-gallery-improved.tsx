"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import {
  getImageCategoryLabel,
  groupImagesByCategory,
  orderedImageEntries,
} from "./property-detail-utils";

interface PropertyDetailGalleryProps {
  property: PublicPropertyDetailDTO;
}

export function PropertyDetailGalleryImproved({ property }: PropertyDetailGalleryProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageEntries = orderedImageEntries(groupImagesByCategory(property.images));
  const allImages = property.images.sort((a, b) => a.sortOrder - b.sortOrder);

  if (imageEntries.length === 0) {
    return null;
  }

  const openLightbox = (imageIndex: number) => {
    setCurrentImageIndex(imageIndex);
    setIsLightboxOpen(true);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const goToPrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const currentImage = allImages[currentImageIndex];

  return (
    <>
      <section id="galeri" className="space-y-6 transition-colors">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Galeri Properti</h2>
            <p className="text-sm text-muted-foreground">Dokumentasi visual area bangunan dan fasilitas.</p>
          </div>
          <Badge className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-100">
            {property.images.length} foto
          </Badge>
        </div>

        <div className="space-y-6">
          {imageEntries.map(([category, images]) => {
            const categoryStartIndex = allImages.findIndex(img => img.id === images[0]?.id);

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                  {getImageCategoryLabel(category)}
                </div>

                {/* Mobile: Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:hidden">
                  {images.map((image, idx) => {
                    const absoluteIndex = categoryStartIndex + idx;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => openLightbox(absoluteIndex)}
                        className="group relative h-32 w-48 shrink-0 snap-start overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md active:scale-95 focus:ring-2 focus:ring-blue-500"
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.caption ?? `${property.name} - ${getImageCategoryLabel(category)}`}
                          fill
                          sizes="192px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>

                {/* Desktop: Grid dengan aspect ratio yang lebih baik */}
                <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {images.map((image, idx) => {
                    const absoluteIndex = categoryStartIndex + idx;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => openLightbox(absoluteIndex)}
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.caption ?? `${property.name} - ${getImageCategoryLabel(category)}`}
                          fill
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-110"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        {/* Hover overlay with info */}
                        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 transition-transform duration-300 group-hover:translate-y-0">
                          <p className="text-xs font-medium text-white line-clamp-2">
                            {image.caption || `${getImageCategoryLabel(category)} - Foto ${idx + 1}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-7xl border-0 bg-black/95 p-0">
          <div className="relative flex h-[90vh] items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Previous Button */}
            {allImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            {currentImage && (
              <div className="relative h-full w-full">
                <Image
                  src={currentImage.imageUrl}
                  alt={currentImage.caption ?? `${property.name} - Foto ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                  unoptimized
                />
              </div>
            )}

            {/* Next Button */}
            {allImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image Counter & Caption */}
            <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 space-y-2 text-center">
              <div className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                {currentImageIndex + 1} / {allImages.length}
              </div>
              {currentImage?.caption && (
                <div className="max-w-2xl rounded-lg bg-black/60 px-4 py-2 text-sm text-white">
                  {currentImage.caption}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
