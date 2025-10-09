"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Bed, Percent, Wallet, Settings, AlertCircle } from "lucide-react";
import type { MyPropertiesDTO } from "@/server/types/adminkos";

interface MyPropertiesProps {
  data: MyPropertiesDTO;
}

const propertyStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-300",
  SUSPENDED: "bg-zinc-100 text-zinc-800 border-zinc-300",
};

const propertyTypeLabels: Record<string, string> = {
  MALE_ONLY: "Putra",
  FEMALE_ONLY: "Putri",
  MIXED: "Campur",
};

export function MyProperties({ data }: MyPropertiesProps) {
  if (data.properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Properti Saya</CardTitle>
          <CardDescription>Belum ada properti terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Properti</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Mulai dengan menambahkan properti kos Anda untuk mulai menerima booking
            </p>
            <Button asChild>
              <Link href="/dashboard/adminkos/properties/create">
                Tambah Properti
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Properti Saya</h2>
          <p className="text-muted-foreground">
            {data.properties.length} properti terdaftar
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/adminkos/properties/create">
            Tambah Properti
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.properties.map((property) => (
          <Card key={property.id} className="overflow-hidden">
            {/* Property Image */}
            <div className="relative h-48 w-full bg-muted">
              {property.mainImageUrl ? (
                <Image
                  src={property.mainImageUrl}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <Badge
                  variant="outline"
                  className={`${propertyStatusColors[property.status] || ""} backdrop-blur-sm`}
                >
                  {property.status}
                </Badge>
              </div>
              {/* Property Type Badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="backdrop-blur-sm">
                  {propertyTypeLabels[property.propertyType] || property.propertyType}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="line-clamp-1">{property.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {property.status !== "APPROVED" && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    Menunggu persetujuan
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Total Kamar</span>
                    <span className="text-sm font-semibold">{property.totalRooms}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-emerald-600" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Tersedia</span>
                    <span className="text-sm font-semibold">{property.availableRooms}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Hunian</span>
                    <span className="text-sm font-semibold">{property.occupancyRate}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Bulan Ini</span>
                    <span className="text-sm font-semibold">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        notation: "compact",
                      }).format(property.revenueThisMonth)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href={`/dashboard/adminkos/properties/${property.id}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Kelola Properti
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

