"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { RoomCard } from "./room-card";
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
  Plus, 
  Bed,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomListItem, RoomListResponse } from "@/server/types";

interface RoomListProps {
  propertyId?: string;
  onRoomEdit?: (room: RoomListItem) => void;
  onRoomDelete?: (room: RoomListItem) => void;
  onRoomToggleAvailability?: (room: RoomListItem) => void;
  showActions?: boolean;
  showProperty?: boolean;
  showCreateButton?: boolean;
  className?: string;
}

const availabilityOptions = [
  { value: "", label: "Semua Status" },
  { value: "true", label: "Tersedia" },
  { value: "false", label: "Terisi" },
];

const sortOptions = [
  { value: "createdAt-desc", label: "Terbaru" },
  { value: "createdAt-asc", label: "Terlama" },
  { value: "roomNumber-asc", label: "Nomor Kamar A-Z" },
  { value: "roomNumber-desc", label: "Nomor Kamar Z-A" },
  { value: "monthlyPrice-asc", label: "Harga Terendah" },
  { value: "monthlyPrice-desc", label: "Harga Tertinggi" },
];

export function RoomList({
  propertyId,
  onRoomEdit,
  onRoomDelete,
  onRoomToggleAvailability,
  showActions = true,
  showProperty = false,
  showCreateButton = true,
  className,
}: RoomListProps) {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
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
  const currentAvailability = searchParams.get("isAvailable") || "";
  const currentRoomType = searchParams.get("roomType") || "";
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

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (propertyId) params.set("propertyId", propertyId);
      if (currentSearch) params.set("search", currentSearch);
      if (currentAvailability) params.set("isAvailable", currentAvailability);
      if (currentRoomType) params.set("roomType", currentRoomType);
      if (currentPage) params.set("page", currentPage.toString());
      params.set("limit", pagination.limit.toString());

      // Parse sort
      const [sortBy, sortOrder] = currentSort.split("-");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/rooms?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }

      const data: RoomListResponse = await response.json();
      setRooms(data.rooms);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms when filters change
  useEffect(() => {
    fetchRooms();
  }, [currentSearch, currentAvailability, currentRoomType, currentSort, currentPage, propertyId]);

  // Handle search
  const handleSearch = (value: string) => {
    updateFilters({ search: value });
  };

  // Handle filter changes
  const handleAvailabilityChange = (value: string) => {
    updateFilters({ isAvailable: value });
  };

  const handleRoomTypeChange = (value: string) => {
    updateFilters({ roomType: value });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sort: value });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateFilters({ page: page.toString() });
  };

  // Handle room availability toggle
  const handleToggleAvailability = async (room: RoomListItem) => {
    try {
      const response = await fetch(`/api/rooms/${room.id}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAvailable: !room.isAvailable,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update room availability");
      }

      // Refresh the list
      fetchRooms();
      
      if (onRoomToggleAvailability) {
        onRoomToggleAvailability(room);
      }
    } catch (error) {
      console.error("Error toggling room availability:", error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchRooms} className="mt-4">
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
          <h2 className="text-2xl font-bold">Kamar</h2>
          <p className="text-muted-foreground">
            Kelola kamar dan ketersediaan
          </p>
        </div>
        {showCreateButton && (
          <Button asChild>
            <a href={propertyId ? `/dashboard/properties/${propertyId}/rooms/create` : "/dashboard/rooms/create"}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kamar
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
            placeholder="Cari kamar..."
            value={currentSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Availability Filter */}
        <Select value={currentAvailability} onValueChange={handleAvailabilityChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Ketersediaan" />
          </SelectTrigger>
          <SelectContent>
            {availabilityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Room Type Filter */}
        <Input
          placeholder="Jenis kamar..."
          value={currentRoomType}
          onChange={(e) => handleRoomTypeChange(e.target.value)}
          className="w-full sm:w-48"
        />

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
      {(currentSearch || currentAvailability || currentRoomType) && (
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
          {currentAvailability && (
            <Badge variant="secondary" className="gap-1">
              Status: {availabilityOptions.find(o => o.value === currentAvailability)?.label}
              <button onClick={() => handleAvailabilityChange("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                ×
              </button>
            </Badge>
          )}
          {currentRoomType && (
            <Badge variant="secondary" className="gap-1">
              Jenis: {currentRoomType}
              <button onClick={() => handleRoomTypeChange("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {rooms.length} dari {pagination.total} kamar
        </p>
      </div>

      {/* Room Grid */}
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
      ) : rooms.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tidak ada kamar ditemukan</p>
            {showCreateButton && (
              <Button asChild className="mt-4">
                <a href={propertyId ? `/dashboard/properties/${propertyId}/rooms/create` : "/dashboard/rooms/create"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kamar Pertama
                </a>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={onRoomEdit}
              onDelete={onRoomDelete}
              onToggleAvailability={handleToggleAvailability}
              showActions={showActions}
              showProperty={showProperty}
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
