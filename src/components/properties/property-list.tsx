"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PropertyCard } from "./property-card";
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
import { 
  Search, 
  Filter, 
  Plus, 
  Building2,
  SortAsc,
  SortDesc
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyListItem, PropertyListResponse } from "@/server/types";
import { PropertyStatus, PropertyType } from "@/server/types/property";

interface PropertyListProps {
  onPropertyEdit?: (property: PropertyListItem) => void;
  onPropertyDelete?: (property: PropertyListItem) => void;
  onPropertyApprove?: (property: PropertyListItem) => void;
  onPropertyReject?: (property: PropertyListItem) => void;
  showActions?: boolean;
  showOwner?: boolean;
  showCreateButton?: boolean;
  className?: string;
}

const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: PropertyStatus.PENDING, label: "Menunggu Persetujuan" },
  { value: PropertyStatus.APPROVED, label: "Disetujui" },
  { value: PropertyStatus.REJECTED, label: "Ditolak" },
  { value: PropertyStatus.SUSPENDED, label: "Disuspend" },
];

const typeOptions = [
  { value: "", label: "Semua Jenis" },
  { value: PropertyType.MALE_ONLY, label: "Kos Putra" },
  { value: PropertyType.FEMALE_ONLY, label: "Kos Putri" },
  { value: PropertyType.MIXED, label: "Kos Campur" },
];

const sortOptions = [
  { value: "createdAt-desc", label: "Terbaru" },
  { value: "createdAt-asc", label: "Terlama" },
  { value: "name-asc", label: "Nama A-Z" },
  { value: "name-desc", label: "Nama Z-A" },
  { value: "totalRooms-desc", label: "Kamar Terbanyak" },
  { value: "totalRooms-asc", label: "Kamar Tersedikit" },
];

export function PropertyList({
  onPropertyEdit,
  onPropertyDelete,
  onPropertyApprove,
  onPropertyReject,
  showActions = true,
  showOwner = false,
  showCreateButton = true,
  className,
}: PropertyListProps) {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const pathname = usePathname();

  // Get current filters from URL
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentType = searchParams.get("propertyType") || "";
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

    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch properties
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      if (currentStatus) params.set("status", currentStatus);
      if (currentType) params.set("propertyType", currentType);
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
  }, [currentSearch, currentStatus, currentType, currentSort, currentPage]);

  // Handle search
  const handleSearch = (value: string) => {
    updateFilters({ search: value });
  };

  // Handle filter changes
  const handleStatusChange = (value: string) => {
    updateFilters({ status: value });
  };

  const handleTypeChange = (value: string) => {
    updateFilters({ propertyType: value });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sort: value });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateFilters({ page: page.toString() });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchProperties} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Properti</h2>
          <p className="text-muted-foreground">
            Kelola properti kos Anda
          </p>
        </div>
        {showCreateButton && (
          <Button asChild>
            <a href="/dashboard/properties/create">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Properti
            </a>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari properti..."
            value={currentSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-48">
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

        {/* Sort */}
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-48">
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
      {(currentSearch || currentStatus || currentType) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filter aktif:</span>
          {currentSearch && (
            <Badge variant="secondary" className="gap-1">
              Pencarian: {currentSearch}
              <button onClick={() => handleSearch("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                ×
              </button>
            </Badge>
          )}
          {currentStatus && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(o => o.value === currentStatus)?.label}
              <button onClick={() => handleStatusChange("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
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
        </div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {properties.length} dari {pagination.total} properti
        </p>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
            <p className="text-muted-foreground">Tidak ada properti ditemukan</p>
            {showCreateButton && (
              <Button asChild className="mt-4">
                <a href="/dashboard/properties/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Properti Pertama
                </a>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={onPropertyEdit}
              onDelete={onPropertyDelete}
              onApprove={onPropertyApprove}
              onReject={onPropertyReject}
              showActions={showActions}
              showOwner={showOwner}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
