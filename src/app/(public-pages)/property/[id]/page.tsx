import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PropertyDetailHero } from "@/components/public/property-detail-hero";
import { PropertyDetailMetrics } from "@/components/public/property-detail-metrics";
import { PropertyDetailOverview } from "@/components/public/property-detail-overview";
import { PropertyDetailFacilities } from "@/components/public/property-detail-facilities";
import { PropertyDetailGallery } from "@/components/public/property-detail-gallery";
import { PropertyDetailRooms } from "@/components/public/property-detail-rooms";
import type { PublicPropertyDetailDTO, PropertyImageDTO, PublicPropertyRoomDTO } from "@/server/types/property";

type PropertyImageApiDTO = Omit<PropertyImageDTO, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type PublicRoomDetailApiDTO = Omit<PublicPropertyRoomDTO, "images"> & {
  images: PropertyImageApiDTO[];
};

type PublicPropertyDetailApiDTO = Omit<PublicPropertyDetailDTO, "createdAt" | "updatedAt" | "images" | "rooms"> & {
  createdAt: string;
  updatedAt: string;
  images: PropertyImageApiDTO[];
  rooms: PublicRoomDetailApiDTO[];
};

interface PublicPropertyDetailApiResponse {
  success: boolean;
  data?: PublicPropertyDetailApiDTO;
  error?: string;
}

function resolveBaseUrl() {
  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  return envBase.startsWith("http") ? envBase : `https://${envBase}`;
}

function toPropertyImageDTO(image: PropertyImageApiDTO): PropertyImageDTO {
  return {
    ...image,
    createdAt: new Date(image.createdAt),
    updatedAt: new Date(image.updatedAt),
  };
}

function transformPropertyDetail(payload: PublicPropertyDetailApiDTO): PublicPropertyDetailDTO {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    images: payload.images.map(toPropertyImageDTO),
    rooms: payload.rooms.map((room) => ({
      ...room,
      images: room.images.map(toPropertyImageDTO),
    })),
  };
}

async function getPropertyDetail(id: string): Promise<PublicPropertyDetailDTO | null> {
  if (!id) return null;

  try {
    const baseUrl = resolveBaseUrl();
    const url = new URL(`/api/public/properties/${encodeURIComponent(id)}`, baseUrl);
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[property-detail] Failed to fetch detail", response.status, response.statusText);
      return null;
    }

    const payload = (await response.json()) as PublicPropertyDetailApiResponse;

    if (!payload.success || !payload.data) {
      console.error("[property-detail] API returned error", payload.error);
      return null;
    }

    return transformPropertyDetail(payload.data);
  } catch (error) {
    console.error("[property-detail] Unexpected error", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyDetail(id);

  if (!property) {
    return {
      title: "Properti tidak ditemukan | myhome",
      description: "Properti yang Anda cari tidak tersedia atau sudah tidak aktif.",
    };
  }

  return {
    title: `${property.name} | Detail Properti myhome`,
    description: property.description,
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyDetail(id);

  if (!property) {
    notFound();
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${property.location.latitude},${property.location.longitude}`;
  const roomCountLabel = property.availableRooms > 0 ? `${property.availableRooms} kamar tersedia` : "Tidak ada kamar tersedia";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <PublicHeader />
      <PropertyDetailHero property={property} mapsUrl={mapsUrl} roomCountLabel={roomCountLabel} />
      <main className="container mx-auto space-y-12 px-6 pb-24">
        <PropertyDetailMetrics property={property} />
        <PropertyDetailOverview property={property} mapsUrl={mapsUrl} />
        <PropertyDetailFacilities property={property} />
        <PropertyDetailGallery property={property} />
        <PropertyDetailRooms property={property} roomCountLabel={roomCountLabel} />
      </main>
      <PublicFooter />
    </div>
  );
}



