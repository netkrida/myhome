"use client";

import { useEffect, useState } from "react";
import { PublicPropertyCard } from "./property-card-public";
import { PropertyFilterBar } from "./property-filter-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { PublicPropertyCardDTO } from "@/server/types";

interface PropertyListingResponse {
  success: boolean;
  data?: {
    properties: PublicPropertyCardDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

interface PropertyFilterParams {
  propertyType?: string;
  provinceName?: string;
  regencyName?: string;
  districtName?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function PropertyListingSection() {
  const [properties, setProperties] = useState<PublicPropertyCardDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<PropertyFilterParams>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchProperties = async (page: number, currentFilters: PropertyFilterParams, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...currentFilters,
      });

      const response = await fetch(`/api/public/properties?${params.toString()}`);
      const result: PropertyListingResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memuat properti");
      }

      if (result.data) {
        if (append) {
          setProperties((prev) => [...prev, ...result.data!.properties]);
        } else {
          setProperties(result.data.properties);
        }
        setTotalPages(result.data.pagination.totalPages);
        setCurrentPage(result.data.pagination.page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProperties(1, filters);
  }, [filters]);

  const handleFilterChange = (newFilters: PropertyFilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    fetchProperties(nextPage, filters, true);
  };

  const handleShare = async (property: PublicPropertyCardDTO) => {
    const url = `${window.location.origin}/property/${property.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: `Lihat kos ${property.name} di ${property.location.districtName}`,
          url: url,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      alert("Link telah disalin ke clipboard!");
    }
  };

  if (isLoading && properties.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="mb-8">
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2 text-center lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Temukan Kos Impianmu
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Pilihan kos terbaik dengan harga terjangkau dan fasilitas lengkap
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <PropertyFilterBar onFilterChange={handleFilterChange} />
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && properties.length === 0 && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <AlertCircle className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada properti ditemukan
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Coba ubah filter pencarian atau hapus beberapa filter untuk melihat lebih banyak hasil.
              </p>
              <Button
                variant="outline"
                onClick={() => handleFilterChange({})}
                className="mt-4"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        )}

        {/* Property Grid */}
        {properties.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((property) => (
                <PublicPropertyCard
                  key={property.id}
                  property={property}
                  onShare={handleShare}
                />
              ))}
            </div>

            {/* Load More */}
            {currentPage < totalPages && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  size="lg"
                  className="min-w-[200px] rounded-full"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    `Muat Lebih Banyak (${currentPage}/${totalPages})`
                  )}
                </Button>
              </div>
            )}

            {/* Results Info */}
            <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Menampilkan {properties.length} dari total Kos Tersedia
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="h-36 w-full" />
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
