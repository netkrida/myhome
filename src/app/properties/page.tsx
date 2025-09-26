"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PublicPropertyCard } from "@/components/homepage/property-card-public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Building2,
  MapPin,
  SlidersHorizontal,
  Heart,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyListItem, PropertyListResponse } from "@/server/types";
import { PropertyType } from "@/server/types/property";

const typeOptions = [
  { value: "", label: "Semua Jenis" },
  { value: PropertyType.MALE_ONLY, label: "Kos Putra" },
  { value: PropertyType.FEMALE_ONLY, label: "Kos Putri" },
  { value: PropertyType.MIXED, label: "Kos Campur" },
];

const sortOptions = [
  { value: "createdAt-desc", label: "Terbaru" },
  { value: "name-asc", label: "Nama A-Z" },
  { value: "totalRooms-desc", label: "Kamar Terbanyak" },
  { value: "availableRooms-desc", label: "Tersedia Terbanyak" },
];

const priceRanges = [
  { value: "", label: "Semua Harga" },
  { value: "0-500000", label: "< Rp 500.000" },
  { value: "500000-1000000", label: "Rp 500.000 - 1.000.000" },
  { value: "1000000-1500000", label: "Rp 1.000.000 - 1.500.000" },
  { value: "1500000-2000000", label: "Rp 1.500.000 - 2.000.000" },
  { value: "2000000-", label: "> Rp 2.000.000" },
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Get current filters from URL
  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("propertyType") || "";
  const currentLocation = searchParams.get("location") || "";
  const currentPriceRange = searchParams.get("priceRange") || "";
  const currentSort = searchParams.get("sort") || "createdAt-desc";
  const currentPage = parseInt(searchParams.get("page") || "1");

  // Update URL with new filters
  const updateFilters = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change (except when changing page)
    if (!filters.page) {
      params.set("page", "1");
    }

    router.push(`/properties?${params.toString()}`);
  };

  // Fetch properties
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("status", "APPROVED"); // Only show approved properties
      if (currentSearch) params.set("search", currentSearch);
      if (currentType) params.set("propertyType", currentType);
      if (currentLocation) params.set("location", currentLocation);
      if (currentPriceRange) params.set("priceRange", currentPriceRange);
      if (currentPage) params.set("page", currentPage.toString());
      params.set("limit", pagination.limit.toString());

      // Parse sort
      const [sortBy, sortOrder] = currentSort.split("-");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/properties?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }

      const data: PropertyListResponse = await response.json();
      setProperties(data.properties);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch properties when filters change
  useEffect(() => {
    fetchProperties();
  }, [currentSearch, currentType, currentLocation, currentPriceRange, currentSort, currentPage]);

  // Handle search
  const handleSearch = (value: string) => {
    updateFilters({ search: value });
  };

  // Handle filter changes
  const handleTypeChange = (value: string) => {
    updateFilters({ propertyType: value });
  };

  const handleLocationChange = (value: string) => {
    updateFilters({ location: value });
  };

  const handlePriceRangeChange = (value: string) => {
    updateFilters({ priceRange: value });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sort: value });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateFilters({ page: page.toString() });
  };

  // Handle favorite
  const handleFavorite = (property: PropertyListItem) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(property.id)) {
      newFavorites.delete(property.id);
    } else {
      newFavorites.add(property.id);
    }
    setFavorites(newFavorites);
    
    // In real implementation, this would sync with backend
    console.log("Favorite toggled for:", property.name);
  };

  // Handle share
  const handleShare = (property: PropertyListItem) => {
    if (navigator.share) {
      navigator.share({
        title: property.name,
        text: `Lihat kos ${property.name} di ${property.location.districtName}`,
        url: `${window.location.origin}/property/${property.id}`,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`);
      alert("Link berhasil disalin!");
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchProperties} className="mt-4">
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cari Kos Impian Anda</h1>
        <p className="text-muted-foreground">
          Temukan kos terbaik dengan fasilitas lengkap dan harga terjangkau
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filter Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama kos atau lokasi..."
                value={currentSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={currentType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Jenis Kos" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range Filter */}
            <Select value={currentPriceRange} onValueChange={handlePriceRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Rentang Harga" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={currentSort} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(currentSearch || currentType || currentLocation || currentPriceRange) && (
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <span className="text-sm text-muted-foreground">Filter aktif:</span>
              {currentSearch && (
                <Badge variant="secondary" className="gap-1">
                  Pencarian: {currentSearch}
                  <button onClick={() => handleSearch("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
              {currentType && (
                <Badge variant="secondary" className="gap-1">
                  Jenis: {typeOptions.find(o => o.value === currentType)?.label}
                  <button onClick={() => handleTypeChange("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
              {currentPriceRange && (
                <Badge variant="secondary" className="gap-1">
                  Harga: {priceRanges.find(o => o.value === currentPriceRange)?.label}
                  <button onClick={() => handlePriceRangeChange("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Menampilkan {properties.length} dari {pagination.total} kos
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4 mr-2" />
            Favorit ({favorites.size})
          </Button>
        </div>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak ada kos ditemukan</h3>
            <p className="text-muted-foreground mb-4">
              Coba ubah filter pencarian atau kata kunci Anda
            </p>
            <Button onClick={() => {
              handleSearch("");
              handleTypeChange("");
              handleLocationChange("");
              handlePriceRangeChange("");
            }}>
              Reset Filter
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PublicPropertyCard
              key={property.id}
              property={property}
              onFavorite={handleFavorite}
              onShare={handleShare}
              isFavorited={favorites.has(property.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            Sebelumnya
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}
