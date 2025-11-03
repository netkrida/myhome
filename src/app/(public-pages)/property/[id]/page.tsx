import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PropertyDetailHeroImproved } from "@/components/public/property-detail-hero-improved";
import { PropertyDetailMetrics } from "@/components/public/property-detail-metrics";
import { PropertyDetailOverview } from "@/components/public/property-detail-overview";
import { PropertyDetailFacilities } from "@/components/public/property-detail-facilities";
import { PropertyDetailGalleryImproved } from "@/components/public/property-detail-gallery-improved";
import { PropertyDetailRooms } from "@/components/public/property-detail-rooms";
import { WhatsAppFloat } from "@/components/public/whatsapp-float";
import { QuickBookingCard } from "@/components/public/quick-booking-card";
import type { PublicPropertyDetailDTO, PropertyImageDTO, PublicPropertyRoomDTO } from "@/server/types/property";
import { PropertyService } from "@/server/services/property.service";

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

  // Get admin WhatsApp contact information
  const adminWaData = await PropertyService.getPublicPropertyWithAdminWA(id);
  const adminWa = adminWaData?.adminWa ?? null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${property.location.latitude},${property.location.longitude}`;
  const roomCountLabel = property.availableRooms > 0 ? `${property.availableRooms} kamar tersedia` : "Tidak ada kamar tersedia";

  // Preset WhatsApp message with property name
  const whatsappPresetText = `Halo AdminKos, saya tertarik dengan properti "${property.name}". Apakah kamar tersedia?`;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <PublicHeader />
      <PropertyDetailHeroImproved property={property} mapsUrl={mapsUrl} roomCountLabel={roomCountLabel} />

      {/* Main Content with Sidebar Layout */}
      <div className="container mx-auto px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
            {/* Left Column - Main Content */}
            <main className="space-y-12">
              <PropertyDetailMetrics property={property} />
              <PropertyDetailOverview property={property} mapsUrl={mapsUrl} />
              <PropertyDetailFacilities property={property} />
              <PropertyDetailGalleryImproved property={property} />
              <PropertyDetailRooms property={property} roomCountLabel={roomCountLabel} />
            </main>

            {/* Right Column - Sticky Sidebar (Desktop Only) */}
            <aside className="hidden lg:block">
              <QuickBookingCard property={property} adminWa={adminWa} />
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile Booking Card - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Mulai dari</div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
              Rp {Math.min(...property.rooms.map(r => r.monthlyPrice)).toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-muted-foreground">/bulan</div>
          </div>
          <a
            href="#booking-section"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-600"
          >
            Pesan Sekarang
          </a>
        </div>
      </div>

      {/* Booking Section Anchor for Mobile */}
      <div id="booking-section" className="lg:hidden">
        <div className="container mx-auto px-4 pb-8">
          <QuickBookingCard property={property} adminWa={adminWa} />
        </div>
      </div>

      <PublicFooter />

      {/* Floating WhatsApp Contact Button */}
      <WhatsAppFloat number={adminWa} presetText={whatsappPresetText} />
    </div>
  );
}



