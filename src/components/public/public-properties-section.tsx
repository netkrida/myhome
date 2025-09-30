import { Skeleton } from "@/components/ui/skeleton";
import type { PublicPropertyCardDTO } from "@/server/types";
import { PublicPropertyCard } from "./property-card-public";

const PUBLIC_PROPERTIES_LIMIT = 6;

interface PublicPropertiesApiResponse {
  success: boolean;
  error?: string;
  data?: {
    properties: PublicPropertyCardDTO[];
  };
}

function resolveBaseUrl() {
  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  return envBase.startsWith("http") ? envBase : `https://${envBase}`;
}

async function fetchPublicProperties(limit: number): Promise<PublicPropertyCardDTO[]> {
  const baseUrl = resolveBaseUrl();
  const url = new URL("/api/public/properties", baseUrl);
  url.searchParams.set("limit", String(limit));

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("Failed to fetch public properties:", response.status, response.statusText);
      return [];
    }

    const payload = (await response.json()) as PublicPropertiesApiResponse;

    if (!payload?.success) {
      console.error("Public properties API returned error:", payload?.error);
      return [];
    }

    return payload?.data?.properties ?? [];
  } catch (error) {
    console.error("Unexpected error while fetching public properties:", error);
    return [];
  }
}

function CardSkeleton() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[18rem] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md">
      <Skeleton className="h-36 w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-auto flex items-center justify-between">
          <Skeleton className="h-8 w-28 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicPropertiesSectionSkeleton() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export async function PublicPropertiesSection() {
  const properties = await fetchPublicProperties(PUBLIC_PROPERTIES_LIMIT);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">Kos Pilihan</span>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Temukan hunian terbaik untukmu
          </h2>
          <p className="max-w-2xl text-slate-500">
            Rekomendasi kos terkurasi dengan fasilitas lengkap, lokasi strategis, dan harga yang bersahabat.
          </p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-12 text-center">
          <h3 className="text-xl font-semibold text-blue-700">Belum ada kos yang bisa ditampilkan</h3>
          <p className="mt-2 text-sm text-slate-500">
            Silakan coba lagi nanti. Kami sedang menyiapkan rekomendasi kos terbaik untuk Anda.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PublicPropertyCard key={property.id} property={property} className="mx-auto" />
          ))}
        </div>
      )}
    </section>
  );
}
