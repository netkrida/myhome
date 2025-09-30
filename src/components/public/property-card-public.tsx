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
    badgeClass: "bg-blue-50 text-blue-600 border border-blue-100",
  },
  [PropertyType.FEMALE_ONLY]: {
    label: "Kos Putri",
    badgeClass: "bg-blue-50 text-blue-600 border border-blue-100",
  },
  [PropertyType.MIXED]: {
    label: "Kos Campur",
    badgeClass: "bg-blue-50 text-blue-600 border border-blue-100",
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
    return <Wifi className="h-3.5 w-3.5 text-blue-500" />;
  }

  if (lower.includes("parkir") || lower.includes("mobil") || lower.includes("motor")) {
    return <Car className="h-3.5 w-3.5 text-blue-500" />;
  }

  return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
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
        "group relative flex h-full w-full max-w-[18rem] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative h-36 w-full overflow-hidden">
        {property.mainImage && !imageError ? (
          <>
            {isImageLoading && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
            <Image
              src={property.mainImage}
              alt={property.name}
              fill
              className="object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <span className="text-sm font-medium text-slate-500">Foto tidak tersedia</span>
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 text-xs">
          {typeInfo && (
            <Badge
              variant="secondary"
              className={cn("rounded-full px-2.5 py-1 font-semibold", typeInfo.badgeClass)}
            >
              {typeInfo.label}
            </Badge>
          )}
          {property.availableRooms > 0 && (
            <Badge className="rounded-full bg-blue-500 px-2.5 py-1 font-semibold text-white">
              {property.availableRooms} kamar
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <Link href={`/property/${property.id}`} className="block">
            <h3 className="line-clamp-2 text-[15px] font-semibold text-slate-900 transition group-hover:text-blue-700">
              {property.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span>
              {property.location.districtName}, {property.location.regencyName}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-blue-500">Mulai dari</div>
          <div className="text-xl font-bold text-blue-700">{formatPrice(property.cheapestMonthlyPrice)}</div>
          <div className="text-[11px] text-slate-400">Harga belum termasuk pajak</div>
        </div>

        {facilities.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Fasilitas utama
            </div>
            <div className="flex flex-wrap gap-2">
              {facilities.map((facility) => (
                <Badge
                  key={facility.id}
                  variant="outline"
                  className="flex items-center gap-1 rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600"
                >
                  {getFacilityIcon(facility.name)}
                  <span>{facility.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <Button
            variant="outline"
            className="h-9 rounded-full border-blue-100 bg-white px-4 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            asChild
          >
            <Link href={`/property/${property.id}`}>Lihat Detail</Link>
          </Button>
          <div className="flex items-center gap-2">
            {onFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-blue-100 text-blue-600 hover:bg-blue-50"
                onClick={(event) => {
                  event.preventDefault();
                  onFavorite(property);
                }}
              >
                <Heart className={cn("h-4 w-4", isFavorited && "fill-current text-rose-400")} />
              </Button>
            )}
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-blue-100 text-blue-600 hover:bg-blue-50"
                onClick={(event) => {
                  event.preventDefault();
                  onShare(property);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
