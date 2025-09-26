"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  Building2, 
  MapPin, 
  Users, 
  Bed, 
  Star,
  Heart,
  Share2,
  Wifi,
  Car,
  Bath
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyListItem } from "@/server/types";
import { PropertyType } from "@/server/types/property";

interface PublicPropertyCardProps {
  property: PropertyListItem;
  onFavorite?: (property: PropertyListItem) => void;
  onShare?: (property: PropertyListItem) => void;
  isFavorited?: boolean;
  className?: string;
}

const typeConfig = {
  [PropertyType.MALE_ONLY]: {
    label: "Kos Putra",
    avatar: "👨",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  [PropertyType.FEMALE_ONLY]: {
    label: "Kos Putri",
    avatar: "👩",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
  },
  [PropertyType.MIXED]: {
    label: "Kos Campur",
    avatar: "👥",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  },
};

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

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoading(false);
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  // Get starting price from rooms (this would come from API in real implementation)
  const getStartingPrice = () => {
    // This is a placeholder - in real implementation, this would come from the property data
    return "Rp 800.000";
  };

  // Get sample facilities (first 3)
  const getSampleFacilities = () => {
    if (!property.facilities || property.facilities.length === 0) return [];
    return property.facilities.slice(0, 3);
  };

  const sampleFacilities = getSampleFacilities();
  const startingPrice = getStartingPrice();

  return (
    <Card className={cn("overflow-hidden hover:shadow-xl transition-all duration-300 group", className)}>
      {/* Property Image */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {property.mainImage && !imageError ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <Image
              src={property.mainImage}
              alt={property.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className={cn("flex items-center gap-1", typeInfo.color)}>
            <span className="text-sm">{typeInfo.avatar}</span>
            {typeInfo.label}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          {onFavorite && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.preventDefault();
                onFavorite(property);
              }}
            >
              <Heart className={cn("h-4 w-4", isFavorited && "fill-red-500 text-red-500")} />
            </Button>
          )}
          {onShare && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.preventDefault();
                onShare(property);
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Availability Badge */}
        {property.availableRooms > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              {property.availableRooms} kamar tersedia
            </Badge>
          </div>
        )}
      </div>

      <Link href={`/property/${property.id}`}>
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {property.name}
              </h3>
              <div className="text-right ml-2">
                <div className="font-bold text-lg text-primary">
                  {startingPrice}
                </div>
                <div className="text-xs text-muted-foreground">
                  mulai dari
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">
                {property.location.districtName}, {property.location.regencyName}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Room Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>{property.totalRooms} kamar</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-green-600 font-medium">
                {property.availableRooms} tersedia
              </span>
            </div>
          </div>

          {/* Sample Facilities */}
          {sampleFacilities.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Fasilitas:</div>
              <div className="flex flex-wrap gap-1">
                {sampleFacilities.map((facility, index) => {
                  // Simple icon mapping
                  let icon = null;
                  if (facility.toLowerCase().includes('wifi') || facility.toLowerCase().includes('internet')) {
                    icon = <Wifi className="h-3 w-3" />;
                  } else if (facility.toLowerCase().includes('parkir') || facility.toLowerCase().includes('motor') || facility.toLowerCase().includes('mobil')) {
                    icon = <Car className="h-3 w-3" />;
                  } else if (facility.toLowerCase().includes('mandi') || facility.toLowerCase().includes('kamar mandi')) {
                    icon = <Bath className="h-3 w-3" />;
                  }

                  return (
                    <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                      {icon}
                      {facility}
                    </Badge>
                  );
                })}
                {property.facilities && property.facilities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{property.facilities.length - 3} lainnya
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Rating (placeholder) */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.5</span>
            </div>
            <span className="text-muted-foreground">(24 ulasan)</span>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <span>
              Okupansi: {Math.round(((property.totalRooms - property.availableRooms) / property.totalRooms) * 100)}%
            </span>
            <span>
              Diperbarui {new Date(property.updatedAt || property.createdAt).toLocaleDateString('id-ID')}
            </span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
