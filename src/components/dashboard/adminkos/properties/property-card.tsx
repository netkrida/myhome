"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  MapPin, 
  Users, 
  Bed, 
  MoreVertical, 
  Edit, 
  Eye, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyListItem } from "@/server/types";
import { PropertyStatus, PropertyType, PROPERTY_FACILITIES } from "@/server/types/property";

interface PropertyCardProps {
  property: PropertyListItem;
  onEdit?: (property: PropertyListItem) => void;
  onDelete?: (property: PropertyListItem) => void;
  onApprove?: (property: PropertyListItem) => void;
  onReject?: (property: PropertyListItem) => void;
  showActions?: boolean;
  showOwner?: boolean;
  className?: string;
}

const statusConfig = {
  [PropertyStatus.PENDING]: {
    label: "Menunggu Persetujuan",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600",
  },
  [PropertyStatus.APPROVED]: {
    label: "Disetujui",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600",
  },
  [PropertyStatus.REJECTED]: {
    label: "Ditolak",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
  [PropertyStatus.SUSPENDED]: {
    label: "Disuspend",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-orange-600",
  },
};

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

export function PropertyCard({
  property,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  showActions = true,
  showOwner = false,
  className,
}: PropertyCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const statusInfo = statusConfig[property.status];
  const typeInfo = typeConfig[property.propertyType];
  const StatusIcon = statusInfo.icon;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}>
      {/* Property Image */}
      <div className="relative h-48 bg-muted">
        {property.mainImage && !imageError ? (
          <Image
            src={property.mainImage}
            alt={property.name}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/adminkos/properties/${property.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Detail
                  </Link>
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(property)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/property/${property.id}`} target="_blank">
                    <Building2 className="h-4 w-4 mr-2" />
                    Lihat Halaman Publik
                  </Link>
                </DropdownMenuItem>
                {onApprove && property.status === PropertyStatus.PENDING && (
                  <DropdownMenuItem onClick={() => onApprove(property)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </DropdownMenuItem>
                )}
                {onReject && property.status === PropertyStatus.PENDING && (
                  <DropdownMenuItem onClick={() => onReject(property)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(property)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {property.name}
            </h3>
          </div>
          
          {/* Property Type */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeInfo.avatar}</span>
            <Badge variant="outline" className={typeInfo.color}>
              {typeInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {property.location.districtName}, {property.location.regencyName}
          </span>
        </div>

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

        {/* Facilities */}
        {property.facilities && property.facilities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Fasilitas Utama</div>
            <div className="flex flex-wrap gap-1">
              {property.facilities.slice(0, 4).map((facility) => {
                // Find facility name from predefined list
                const facilityInfo = [
                  ...PROPERTY_FACILITIES.property,
                  ...PROPERTY_FACILITIES.parking
                ].find(f => f.id === facility.id);

                return (
                  <Badge
                    key={facility.id}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    {facilityInfo?.name || facility.name}
                  </Badge>
                );
              })}
              {property.facilities.length > 4 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{property.facilities.length - 4} lainnya
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Owner Info */}
        {showOwner && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Pemilik:</span> {property.owner.name || property.owner.email}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>
            Dibuat {new Date(property.createdAt).toLocaleDateString('id-ID')}
          </span>
          <span>
            Okupansi: {Math.round(((property.totalRooms - property.availableRooms) / property.totalRooms) * 100)}%
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
