"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, Search } from "lucide-react";

interface PropertyFilterBarProps {
  onFilterChange: (filters: FilterParams) => void;
}

interface FilterParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const sortOptions = [
  { value: "price", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
];

export function PropertyFilterBar({ onFilterChange }: PropertyFilterBarProps) {
  const handleSortChange = (value: string) => {
    const newFilters: FilterParams = {};

    if (value === "price") {
      newFilters.sortBy = "price";
      newFilters.sortOrder = "asc";
    } else if (value === "price_desc") {
      newFilters.sortBy = "price";
      newFilters.sortOrder = "desc";
    }

    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Quick Sort - Always Visible */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Urutkan:
        </Label>
        <Select
          defaultValue="price"
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px] rounded-full">
            <SelectValue placeholder="Pilih urutan" />
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

      {/* Filter Button - Links to /cari-kos */}
      <div className="flex items-center gap-3">
        <Link href="/cari-kos">
          <Button
            variant="default"
            className="group rounded-full gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
          >
            <Search className="h-4 w-4" />
            <span>Cari & Filter Kos</span>
            <SlidersHorizontal className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
