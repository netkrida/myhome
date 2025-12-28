"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Car, CheckCircle2, Heart, MapPin, Share2, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicPropertyCardDTO } from "@/server/types";
import { PropertyType } from "@/server/types/property";

interface PublicPropertyCardProps {
  property: PublicPropertyCardDTO;
  onFavorite?: (property: PublicPropertyCardDTO) => void;
  onShare?: (property: PublicPropertyCardDTO) => void;
  isFavorited?: boolean;
  className?: string;
}

const typeConfig: Record<PropertyType, { label: string; badgeClass: string }> = {
  [PropertyType.MALE_ONLY]: {
    label: "Kos Putra",
    badgeClass: "bg-blue-50 text-blue-600 border border-blue-100 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
  },
  [PropertyType.FEMALE_ONLY]: {
    label: "Kos Putri",
    badgeClass: "bg-blue-50 text-blue-600 border border-blue-100 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
  },
  [PropertyType.MIXED]: {
    label: "Kos Campur",
    badgeClass: "bg-blue-50 text-blue-600 border border-blue-100 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
  },
};

const priceFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatPrice(price?: number) {
  if (!price || price <= 0) return "Hubungi untuk harga";
  return `${priceFormatter.format(price)}/bulan`;
}

function getFacilityIcon(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("wifi") || lower.includes("internet")) {
    return <Wifi className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />;
  }

  if (lower.includes("parkir") || lower.includes("mobil") || lower.includes("motor")) {
    return <Car className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />;
  }

  return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />;
}

export function PublicPropertyCard({
  property,
  onFavorite,
  onShare,
  isFavorited = false,
  className,
}: PublicPropertyCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const typeInfo = typeConfig[property.propertyType];
  const facilities = property.facilities?.slice(0, 2) ?? [];

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoading(false);
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  return (
    <Card
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900/90 dark:hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.65)] dark:hover:shadow-primary/10 sm:rounded-3xl",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:h-36 sm:aspect-auto">
        {property.mainImage && !imageError ? (
          <>
            {isImageLoading && <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700/60" />}
            <Image
              src={property.mainImage}
              alt={property.name}
              fill
              className="object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              unoptimized
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Foto tidak tersedia</span>
          </div>
        )}

        <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1 text-xs sm:inset-x-3 sm:top-3">
          {typeInfo && (
            <Badge
              variant="secondary"
              className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs", typeInfo.badgeClass)}
            >
              {typeInfo.label}
            </Badge>
          )}
          {property.availableRooms > 0 ? (
            <Badge className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-blue-500/80 sm:px-2.5 sm:py-1 sm:text-xs">
              {property.availableRooms} kamar
            </Badge>
          ) : (
            <Badge className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-red-500/80 sm:px-2.5 sm:py-1 sm:text-xs">
              Penuh
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2">
          <Link href={`/property/${property.id}`} className="block">
            <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-slate-900 transition group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300 sm:text-[15px] sm:leading-normal">
              {property.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-300 sm:gap-2 sm:text-xs">
            <MapPin className="h-3 w-3 shrink-0 text-blue-500 dark:text-blue-300 sm:h-3.5 sm:w-3.5" />
            <span className="truncate">
              {property.location.districtName}, {property.location.regencyName}
            </span>
          </div>
        </div>

        <div className="space-y-0.5 sm:space-y-1">
          <div className="text-[9px] font-medium uppercase tracking-wide text-blue-500 dark:text-blue-300 sm:text-[11px]">Mulai dari</div>
          <div className="text-sm font-bold text-blue-700 dark:text-blue-300 sm:text-xl">{formatPrice(property.cheapestMonthlyPrice)}</div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 sm:text-[11px]">Harga belum termasuk pajak</div>
        </div>

        {facilities.length > 0 && (
          <div className="hidden space-y-2 sm:block">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Fasilitas utama
            </div>
            <div className="flex flex-wrap gap-2">
              {facilities.map((facility) => (
                <Badge
                  key={facility.id}
                  variant="outline"
                  className="flex items-center gap-1 rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {getFacilityIcon(facility.name)}
                  <span>{facility.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-1">
          <Button
            variant="outline"
            className="h-7 flex-1 rounded-full border-blue-100 bg-white px-2 text-[10px] font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/30 sm:h-9 sm:flex-none sm:px-4 sm:text-xs"
            asChild
          >
            <Link href={`/property/${property.id}`}>Lihat Detail</Link>
          </Button>
          <div className="flex items-center gap-1 sm:gap-2">
            {onFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full border border-blue-100 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-200 dark:hover:bg-blue-900/30 sm:h-8 sm:w-8"
                onClick={(event) => {
                  event.preventDefault();
                  onFavorite(property);
                }}
              >
                <Heart className={cn("h-3 w-3 sm:h-4 sm:w-4", isFavorited && "fill-current text-rose-400")} />
              </Button>
            )}
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full border border-blue-100 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-200 dark:hover:bg-blue-900/30 sm:h-8 sm:w-8"
                onClick={(event) => {
                  event.preventDefault();
                  onShare(property);
                }}
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
