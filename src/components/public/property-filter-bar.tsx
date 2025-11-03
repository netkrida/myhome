"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Filter, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyFilterBarProps {
  onFilterChange: (filters: FilterParams) => void;
}

interface FilterParams {
  propertyType?: string;
  provinceName?: string;
  regencyName?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface Region {
  code: string;
  name: string;
}

const propertyTypes = [
  { value: "MALE_ONLY", label: "Kos Putra" },
  { value: "FEMALE_ONLY", label: "Kos Putri" },
  { value: "MIXED", label: "Kos Campur" },
];

const sortOptions = [
  { value: "price", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
];

const priceRanges = [
  { min: "0", max: "500000", label: "< Rp 500rb" },
  { min: "500000", max: "1000000", label: "Rp 500rb - 1jt" },
  { min: "1000000", max: "2000000", label: "Rp 1jt - 2jt" },
  { min: "2000000", max: "5000000", label: "Rp 2jt - 5jt" },
  { min: "5000000", max: "", label: "> Rp 5jt" },
];

export function PropertyFilterBar({ onFilterChange }: PropertyFilterBarProps) {
  const [filters, setFilters] = useState<FilterParams>({});
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    fetchProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load regencies when province is selected
  useEffect(() => {
    if (filters.provinceName) {
      // Find the province code from the selected province name
      const selectedProvince = provinces.find(p => p.name === filters.provinceName);
      if (selectedProvince) {
        fetchRegencies(selectedProvince.code);
      }
    } else {
      setRegencies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.provinceName]);

  const fetchProvinces = async () => {
    try {
      setIsLoadingProvinces(true);
      console.log("🔄 Fetching provinces...");
      const response = await fetch("/api/wilayah/provinces");
      console.log("📡 Provinces response status:", response.status);

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          console.log("✅ Provinces data:", data);
          if (data.success && data.data) {
            setProvinces(data.data);
            console.log(`📍 Loaded ${data.data.length} provinces`);
            console.log("📝 Sample province names:", data.data.slice(0, 3).map((p: any) => p.name));
          } else {
            console.warn("⚠️ Provinces API returned unexpected format:", data);
            setProvinces([]);
          }
        } else {
          console.warn("⚠️ Provinces API not available - returning empty list");
          setProvinces([]);
        }
      } else {
        console.warn("⚠️ Provinces API returned non-OK status:", response.status);
        const text = await response.text();
        console.warn("Response body:", text.substring(0, 200));
        setProvinces([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch provinces:", error);
      setProvinces([]);
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  const fetchRegencies = async (provinceCode: string) => {
    try {
      setIsLoadingRegencies(true);
      console.log("🔄 Fetching regencies for province:", provinceCode);
      const response = await fetch(`/api/wilayah/regencies/${provinceCode}`);
      console.log("📡 Regencies response status:", response.status);

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          console.log("✅ Regencies data:", data);
          if (data.success && data.data) {
            setRegencies(data.data);
            console.log(`📍 Loaded ${data.data.length} regencies`);
          } else {
            console.warn("⚠️ Regencies API returned unexpected format:", data);
            setRegencies([]);
          }
        } else {
          console.warn("⚠️ Regencies API not available - returning empty list");
          setRegencies([]);
        }
      } else {
        console.warn("⚠️ Regencies API returned non-OK status:", response.status);
        setRegencies([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch regencies:", error);
      setRegencies([]);
    } finally {
      setIsLoadingRegencies(false);
    }
  };

  const handleFilterUpdate = (key: keyof FilterParams, value: string | undefined) => {
    const newFilters = { ...filters };

    if (value && value !== "all") {
      // Type-safe assignment
      if (key === "sortOrder") {
        newFilters[key] = value as "asc" | "desc";
      } else {
        newFilters[key] = value as any;
      }
    } else {
      delete newFilters[key];
    }

    // Cascade reset: province -> regency
    if (key === "provinceName" && filters.provinceName !== value) {
      delete newFilters.regencyName;
    }

    setFilters(newFilters);
  };

  const handlePriceRangeSelect = (min: string, max: string) => {
    const newFilters = { ...filters };

    if (min) newFilters.minPrice = min;
    else delete newFilters.minPrice;

    if (max) newFilters.maxPrice = max;
    else delete newFilters.maxPrice;

    setFilters(newFilters);
  };

  const handleSortChange = (value: string) => {
    const newFilters = { ...filters };

    if (value === "price") {
      newFilters.sortBy = "price";
      newFilters.sortOrder = "asc";
    } else if (value === "price_desc") {
      newFilters.sortBy = "price";
      newFilters.sortOrder = "desc";
    } else if (value === "newest") {
      newFilters.sortBy = "createdAt";
      newFilters.sortOrder = "desc";
    } else {
      newFilters.sortBy = value;
      newFilters.sortOrder = "asc";
    }

    setFilters(newFilters);
  };

  const applyFilters = () => {
    console.log("🎯 Applying filters:", JSON.stringify(filters, null, 2));
    onFilterChange(filters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setFilters({});
    onFilterChange({});
    setIsOpen(false);
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(
      (key) => !["sortBy", "sortOrder"].includes(key)
    ).length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Quick Sort - Always Visible */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Urutkan:
        </Label>
        <Select
          value={
            filters.sortBy === "price" && filters.sortOrder === "desc"
              ? "price_desc"
              : filters.sortBy === "createdAt"
              ? "newest"
              : filters.sortBy || "price"
          }
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

      {/* Filter Button with Sheet */}
      <div className="flex items-center gap-3">
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="rounded-full px-3">
            {activeFilterCount} filter aktif
          </Badge>
        )}

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "rounded-full gap-2",
                activeFilterCount > 0 && "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 rounded-full px-2 py-0.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Pencarian</SheetTitle>
              <SheetDescription>
                Sesuaikan pencarian Anda dengan filter di bawah ini
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Property Type */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tipe Properti</Label>
                <Select
                  value={filters.propertyType}
                  onValueChange={(value) => handleFilterUpdate("propertyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe kos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filters - Cascading: Province -> Regency -> District */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Lokasi</Label>

                {/* Province */}
                <Select
                  value={filters.provinceName}
                  onValueChange={(value) => handleFilterUpdate("provinceName", value)}
                  disabled={isLoadingProvinces || provinces.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingProvinces
                          ? "Memuat provinsi..."
                          : provinces.length === 0
                          ? "Provinsi tidak tersedia"
                          : "Pilih Provinsi"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Provinsi</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province.code} value={province.name}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                  {/* Regency - Only show when province is selected */}
                  {filters.provinceName && (
                    <Select
                      value={filters.regencyName}
                      onValueChange={(value) => handleFilterUpdate("regencyName", value)}
                      disabled={isLoadingRegencies}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kabupaten/Kota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kota</SelectItem>
                        {regencies.map((regency) => (
                          <SelectItem key={regency.code} value={regency.name}>
                            {regency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Rentang Harga (per bulan)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {priceRanges.map((range) => (
                    <Button
                      key={range.label}
                      type="button"
                      variant={
                        filters.minPrice === range.min && filters.maxPrice === range.max
                          ? "default"
                          : "outline"
                      }
                      className="justify-start text-xs"
                      onClick={() => handlePriceRangeSelect(range.min, range.max)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                {/* Custom Price Range */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Harga Minimal
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice || ""}
                      onChange={(e) => handleFilterUpdate("minPrice", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                      Harga Maksimal
                    </Label>
                    <Input
                      type="number"
                      placeholder="Tidak terbatas"
                      value={filters.maxPrice || ""}
                      onChange={(e) => handleFilterUpdate("maxPrice", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter className="mt-8 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                type="button"
                onClick={applyFilters}
                className="w-full sm:w-auto"
              >
                <Filter className="mr-2 h-4 w-4" />
                Terapkan Filter
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
