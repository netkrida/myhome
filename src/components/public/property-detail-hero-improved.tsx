"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, DoorOpen, Heart, ImagePlus, MapPin, Sparkles, ArrowUpRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import { getPropertyTypeMeta } from "./property-detail-utils";

interface PropertyDetailHeroProps {
  property: PublicPropertyDetailDTO;
  mapsUrl: string;
  roomCountLabel: string;
}

export function PropertyDetailHeroImproved({ property, mapsUrl, roomCountLabel }: PropertyDetailHeroProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sortedImages = [...property.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const heroImage = sortedImages[0];
  const secondaryImages = sortedImages.slice(1, 5);
  const extraImageCount = Math.max(sortedImages.length - 5, 0);
  const typeMeta = getPropertyTypeMeta(property.propertyType);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const goToPrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  const currentImage = sortedImages[currentImageIndex];

  return (
    <>
      <section className="bg-background pb-6 pt-4 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6">
          {heroImage && (
            <>
              {/* Mobile: Single large image */}
              <div className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => openLightbox(0)}
                  className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all active:scale-[0.99]"
                >
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.caption ?? `${property.name} - Tampilan utama`}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  {sortedImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                      <ImagePlus className="h-4 w-4" />
                      <span>{sortedImages.length} Foto</span>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Simpan properti"
                  className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition hover:bg-white hover:scale-110 active:scale-95 backdrop-blur-sm"
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>

              {/* Desktop: Hero Grid Layout - 5 images (1 large + 4 small) */}
              <div className="relative hidden h-[500px] gap-3 md:grid md:grid-cols-4 md:grid-rows-2">
                {/* Main large image - spans 2 columns and 2 rows */}
                <button
                  type="button"
                  onClick={() => openLightbox(0)}
                  className="group relative col-span-2 row-span-2 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.caption ?? `${property.name} - Tampilan utama`}
                    fill
                    priority
                    sizes="50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </button>

                {/* Secondary images - 4 smaller images in a 2x2 grid */}
                {secondaryImages.slice(0, 4).map((image, index) => {
                  const isLast = index === 3;
                  const showOverlay = isLast && extraImageCount > 0;
                  const imageIndex = index + 1;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => openLightbox(imageIndex)}
                      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Image
                        src={image.imageUrl}
                        alt={image.caption ?? `${property.name} - Foto ${imageIndex + 1}`}
                        fill
                        sizes="25vw"
                        className="object-cover transition duration-500 group-hover:scale-110"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {showOverlay && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 text-white backdrop-blur-sm transition hover:bg-slate-900/80">
                          <ImagePlus className="h-6 w-6" />
                          <span className="text-sm font-semibold">
                            +{extraImageCount} foto lainnya
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Favorite button - positioned over the grid */}
                <button
                  type="button"
                  aria-label="Simpan properti"
                  className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition hover:bg-white hover:scale-110 active:scale-95 backdrop-blur-sm"
                >
                  <Heart className="h-5 w-5" />
                </button>

                {/* View all photos button */}
                {sortedImages.length > 5 && (
                  <button
                    type="button"
                    onClick={() => openLightbox(0)}
                    className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-white hover:scale-105 active:scale-95 backdrop-blur-sm"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span>Lihat {sortedImages.length} Foto</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Property Info */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 lg:max-w-3xl">
              {typeMeta ? (
                <Badge
                  variant="outline"
                  className={`${typeMeta.badgeClass} inline-flex h-8 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200`}
                >
                  <Sparkles className="h-4 w-4" />
                  {typeMeta.label}
                </Badge>
              ) : (
                <Badge className="inline-flex h-8 items-center gap-2 rounded-full bg-blue-50 px-4 text-sm font-semibold text-blue-700 shadow-sm dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                  Properti myhome
                </Badge>
              )}

              <div className="space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {property.name}
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
                  {property.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-sm">
                  <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                  <span className="font-medium">{property.location.districtName}, {property.location.regencyName}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-sm">
                  <DoorOpen className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                  <span className="font-medium">{roomCountLabel}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-sm">
                  <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-300" />
                  <span className="font-medium">Dibangun {property.buildYear}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-[280px]">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Alamat Lengkap
                </div>
                <div className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                  {property.location.fullAddress}
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-blue-200 bg-blue-50 font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:shadow-md dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/50"
              >
                <Link href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="mr-2 h-4 w-4" />
                  Lihat di Google Maps
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] border-0 bg-black/95 p-0 sm:max-w-7xl" aria-describedby="lightbox-description">
          <DialogTitle className="sr-only">Galeri Foto {property.name}</DialogTitle>
          <span id="lightbox-description" className="sr-only">Image lightbox viewer</span>
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
            {sortedImages.length > 1 && (
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
            {sortedImages.length > 1 && (
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
              <div className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                {currentImageIndex + 1} / {sortedImages.length}
              </div>
              {currentImage?.caption && (
                <div className="max-w-2xl rounded-lg bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm">
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
