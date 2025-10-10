import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { RoomDetailContent } from "@/components/public/room-detail-content";
import { RoomDetailSkeleton } from "@/components/public/room-detail-skeleton";

interface RoomDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function resolveBaseUrl() {
  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  return envBase.startsWith("http") ? envBase : `https://${envBase}`;
}

export async function generateMetadata({ params }: RoomDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const baseUrl = resolveBaseUrl();
    const response = await fetch(`${baseUrl}/api/public/properties/${id}/room-types`, {
      cache: "force-cache",
    });

    if (!response.ok) {
      return {
        title: "Detail Kamar - MyHome",
        description: "Detail kamar kos dengan informasi lengkap dan ketersediaan real-time.",
      };
    }

    const data = await response.json();
    const property = data.data?.property;

    if (!property) {
      return {
        title: "Detail Kamar - MyHome",
        description: "Detail kamar kos dengan informasi lengkap dan ketersediaan real-time.",
      };
    }

    return {
      title: `Detail Kamar - ${property.name} | MyHome`,
      description: `Lihat detail kamar dan ketersediaan real-time di ${property.name}. Lokasi: ${property.fullAddress}`,
      openGraph: {
        title: `Detail Kamar - ${property.name}`,
        description: `Lihat detail kamar dan ketersediaan real-time di ${property.name}`,
        type: "website",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Detail Kamar - MyHome",
      description: "Detail kamar kos dengan informasi lengkap dan ketersediaan real-time.",
    };
  }
}

export default async function RoomDetailPage({ params, searchParams }: RoomDetailPageProps) {
  const { id } = await params;
  const search = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<RoomDetailSkeleton />}>
          <RoomDetailContent
            propertyId={id}
            roomType={search.roomType as string}
            includeOccupied={search.includeOccupied === 'true'}
          />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}