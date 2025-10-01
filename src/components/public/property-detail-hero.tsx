import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DoorOpen, Heart, ImagePlus, MapPin, Sparkles, ArrowUpRight } from "lucide-react";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import { getPropertyTypeMeta } from "./property-detail-utils";

interface PropertyDetailHeroProps {
  property: PublicPropertyDetailDTO;
  mapsUrl: string;
  roomCountLabel: string;
}

export function PropertyDetailHero({ property, mapsUrl, roomCountLabel }: PropertyDetailHeroProps) {
  const sortedImages = [...property.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const heroImage = sortedImages[0];
  const secondaryImages = sortedImages.slice(1, 5);
  const extraImageCount = Math.max(sortedImages.length - (1 + secondaryImages.length), 0);
  const typeMeta = getPropertyTypeMeta(property.propertyType);
  return (
    <section className="bg-background pb-6 pt-4 transition-colors">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-5 px-4">
        {heroImage && (
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.15fr)]">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.caption ?? `${property.name} - Tampilan utama`}
                fill
                priority
                sizes="(min-width: 768px) 65vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <button
                type="button"
                aria-label="Simpan properti"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground/80 shadow-lg transition hover:bg-card"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {secondaryImages.length > 0 && (
              <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-3">
                {secondaryImages.map((image, index) => {
                  const isLast = index === secondaryImages.length - 1;
                  const showOverlay = isLast && extraImageCount > 0;

                  return (
                    <div
                      key={image.id}
                      className="group relative overflow-hidden rounded-3xl"
                    >
                      <Image
                        src={image.imageUrl}
                        alt={image.caption ?? `${property.name} - Foto tambahan ${index + 1}`}
                        fill
                        sizes="(min-width: 768px) 35vw, 50vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                      {showOverlay ? (
                        <button
                          type="button"
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/55 text-white transition hover:bg-slate-900/70"
                        >
                          <ImagePlus className="h-6 w-6" />
                          <span className="text-sm font-semibold">Lihat semua foto{extraImageCount > 1 ? ` (+${extraImageCount})` : ""}</span>
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4 md:max-w-3xl">
            {typeMeta ? (
              <Badge
                variant="outline"
                className={`${typeMeta.badgeClass} inline-flex h-8 items-center gap-3 rounded-full px-4 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200`}
              >
                <Sparkles className="h-4 w-4" />
                {typeMeta.label}
              </Badge>
            ) : (
              <Badge className="inline-flex h-8 items-center gap-3 rounded-full bg-blue-50 px-4 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                Properti myhome
              </Badge>
            )}

            <div className="space-y-3">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">{property.name}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{property.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1">
                <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                {property.location.districtName}, {property.location.regencyName}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1">
                <DoorOpen className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                {roomCountLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1">
                <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                Dibangun {property.buildYear}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:w-[260px]">
            <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">Alamat lengkap</div>
              <div className="mt-2 text-sm font-medium text-foreground">{property.location.fullAddress}</div>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/40"
            >
              <Link href={mapsUrl} target="_blank" rel="noopener noreferrer">
                Lihat di Google Maps
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}






