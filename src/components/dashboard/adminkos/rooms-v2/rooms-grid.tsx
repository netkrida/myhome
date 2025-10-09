"use client";

import { useState } from "react";
import { RoomCard } from "./room-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomGridItem {
  id: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  hasActiveBooking: boolean;
  mainImageUrl: string | null;
  status: "available" | "occupied" | "unavailable";
}

interface RoomsGridProps {
  rooms: RoomGridItem[];
  isLoading?: boolean;
  onRoomClick: (room: RoomGridItem) => void;
  onRoomEdit: (room: RoomGridItem) => void;
  onViewBooking: (room: RoomGridItem) => void;
  onViewDetail?: (room: RoomGridItem) => void;
}

type SortOption = "roomNumber" | "floor" | "price";
type FilterStatus = "all" | "available" | "occupied" | "unavailable";

export function RoomsGrid({
  rooms,
  isLoading = false,
  onRoomClick,
  onRoomEdit,
  onViewBooking,
  onViewDetail,
}: RoomsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("roomNumber");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");

  // Get unique floors
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  // Filter and sort rooms
  const filteredRooms = rooms
    .filter((room) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !room.roomNumber.toLowerCase().includes(query) &&
          !room.roomType.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== "all" && room.status !== filterStatus) {
        return false;
      }

      // Floor filter
      if (filterFloor !== "all" && room.floor.toString() !== filterFloor) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "roomNumber":
          return a.roomNumber.localeCompare(b.roomNumber, undefined, {
            numeric: true,
          });
        case "floor":
          return a.floor - b.floor;
        case "price":
          return a.monthlyPrice - b.monthlyPrice;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card">
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor kamar atau tipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-40">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roomNumber">No. Kamar</SelectItem>
            <SelectItem value="floor">Lantai</SelectItem>
            <SelectItem value="price">Harga</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Status */}
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as FilterStatus)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="available">Tersedia</SelectItem>
            <SelectItem value="occupied">Terisi</SelectItem>
            <SelectItem value="unavailable">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Floor */}
        <Select value={filterFloor} onValueChange={setFilterFloor}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Lantai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lantai</SelectItem>
            {floors.map((floor) => (
              <SelectItem key={floor} value={floor.toString()}>
                Lantai {floor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Menampilkan {filteredRooms.length} dari {rooms.length} kamar
        </span>
        {(searchQuery || filterStatus !== "all" || filterFloor !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterStatus("all");
              setFilterFloor("all");
            }}
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* Grid */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Tidak ada kamar ditemukan</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Coba ubah filter atau kata kunci pencarian
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setFilterStatus("all");
              setFilterFloor("all");
            }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              id={room.id}
              roomNumber={room.roomNumber}
              roomType={room.roomType}
              floor={room.floor}
              monthlyPrice={room.monthlyPrice}
              status={room.status}
              hasActiveBooking={room.hasActiveBooking}
              mainImageUrl={room.mainImageUrl}
              onClick={() => onRoomClick(room)}
              onEdit={() => onRoomEdit(room)}
              onViewBooking={
                room.hasActiveBooking ? () => onViewBooking(room) : undefined
              }
              onViewDetail={onViewDetail ? () => onViewDetail(room) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

