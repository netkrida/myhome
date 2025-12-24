"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicPropertyCard } from "@/components/public/property-card-public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Search,
    SlidersHorizontal,
    X,
    Filter,
    Loader2,
    AlertCircle,
    MapPin,
    Home,
    Building2,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface FilterParams {
    keyword?: string;
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
    { value: "MALE_ONLY", label: "Kos Putra", icon: "👨" },
    { value: "FEMALE_ONLY", label: "Kos Putri", icon: "👩" },
    { value: "MIXED", label: "Kos Campur", icon: "👥" },
];

const priceRanges = [
    { min: "0", max: "500000", label: "< Rp 500rb" },
    { min: "500000", max: "1000000", label: "Rp 500rb - 1jt" },
    { min: "1000000", max: "2000000", label: "Rp 1jt - 2jt" },
    { min: "2000000", max: "5000000", label: "Rp 2jt - 5jt" },
    { min: "5000000", max: "", label: "> Rp 5jt" },
];

const sortOptions = [
    { value: "price_asc", label: "Harga Terendah" },
    { value: "price_desc", label: "Harga Tertinggi" },
    { value: "newest", label: "Terbaru" },
];

function CariKosContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [properties, setProperties] = useState<PublicPropertyCardDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Filter state
    const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
    const [filters, setFilters] = useState<FilterParams>({
        keyword: searchParams.get("keyword") || undefined,
        propertyType: searchParams.get("propertyType") || undefined,
        provinceName: searchParams.get("provinceName") || undefined,
        regencyName: searchParams.get("regencyName") || undefined,
        minPrice: searchParams.get("minPrice") || undefined,
        maxPrice: searchParams.get("maxPrice") || undefined,
        sortBy: searchParams.get("sortBy") || "price",
        sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    });

    // Location state
    const [provinces, setProvinces] = useState<Region[]>([]);
    const [regencies, setRegencies] = useState<Region[]>([]);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);

    // Fetch provinces on mount
    useEffect(() => {
        fetchProvinces();
    }, []);

    // Fetch regencies when province changes
    useEffect(() => {
        if (filters.provinceName) {
            const selectedProvince = provinces.find(p => p.name === filters.provinceName);
            if (selectedProvince) {
                fetchRegencies(selectedProvince.code);
            }
        } else {
            setRegencies([]);
        }
    }, [filters.provinceName, provinces]);

    // Fetch properties when filters change
    useEffect(() => {
        fetchProperties(1, filters);
    }, [filters]);

    const fetchProvinces = async () => {
        try {
            setIsLoadingProvinces(true);
            const response = await fetch("/api/wilayah/provinces");
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setProvinces(data.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch provinces:", error);
        } finally {
            setIsLoadingProvinces(false);
        }
    };

    const fetchRegencies = async (provinceCode: string) => {
        try {
            setIsLoadingRegencies(true);
            const response = await fetch(`/api/wilayah/regencies/${provinceCode}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setRegencies(data.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch regencies:", error);
        } finally {
            setIsLoadingRegencies(false);
        }
    };

    const fetchProperties = async (page: number, currentFilters: FilterParams, append = false) => {
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
            });

            // Add filters to params
            if (currentFilters.keyword) params.set("keyword", currentFilters.keyword);
            if (currentFilters.propertyType) params.set("propertyType", currentFilters.propertyType);
            if (currentFilters.provinceName) params.set("provinceName", currentFilters.provinceName);
            if (currentFilters.regencyName) params.set("regencyName", currentFilters.regencyName);
            if (currentFilters.minPrice) params.set("minPrice", currentFilters.minPrice);
            if (currentFilters.maxPrice) params.set("maxPrice", currentFilters.maxPrice);
            if (currentFilters.sortBy) params.set("sortBy", currentFilters.sortBy);
            if (currentFilters.sortOrder) params.set("sortOrder", currentFilters.sortOrder);

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
                setTotalResults(result.data.pagination.total);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, keyword: keyword || undefined }));
    };

    const handleFilterUpdate = (key: keyof FilterParams, value: string | undefined) => {
        const newFilters = { ...filters };

        if (value && value !== "all") {
            if (key === "sortOrder") {
                newFilters[key] = value as "asc" | "desc";
            } else {
                (newFilters as any)[key] = value;
            }
        } else {
            delete (newFilters as any)[key];
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

        if (value === "price_asc") {
            newFilters.sortBy = "price";
            newFilters.sortOrder = "asc";
        } else if (value === "price_desc") {
            newFilters.sortBy = "price";
            newFilters.sortOrder = "desc";
        } else if (value === "newest") {
            newFilters.sortBy = "createdAt";
            newFilters.sortOrder = "desc";
        }

        setFilters(newFilters);
    };

    const handlePropertyTypeToggle = (type: string) => {
        if (filters.propertyType === type) {
            handleFilterUpdate("propertyType", undefined);
        } else {
            handleFilterUpdate("propertyType", type);
        }
    };

    const resetFilters = () => {
        setKeyword("");
        setFilters({});
        setIsMobileFilterOpen(false);
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
                console.log("Share cancelled");
            }
        } else {
            await navigator.clipboard.writeText(url);
            alert("Link telah disalin ke clipboard!");
        }
    };

    const getActiveFilterCount = () => {
        return Object.keys(filters).filter(
            (key) => !["sortBy", "sortOrder", "keyword"].includes(key)
        ).length;
    };

    const activeFilterCount = getActiveFilterCount();

    // Filter Sidebar Component
    const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
        <div className={cn("space-y-6", mobile ? "" : "sticky top-24")}>
            {/* Property Type */}
            <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Tipe Kos
                </Label>
                <div className="space-y-2">
                    {propertyTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => handlePropertyTypeToggle(type.value)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                                filters.propertyType === type.value
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                        >
                            <span className="text-lg">{type.icon}</span>
                            <span className="text-sm font-medium">{type.label}</span>
                            {filters.propertyType === type.value && (
                                <span className="ml-auto text-primary">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Lokasi
                </Label>

                {/* Province */}
                <Select
                    value={filters.provinceName || "all"}
                    onValueChange={(value) => handleFilterUpdate("provinceName", value)}
                    disabled={isLoadingProvinces || provinces.length === 0}
                >
                    <SelectTrigger className="rounded-xl">
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

                {/* Regency */}
                {filters.provinceName && (
                    <Select
                        value={filters.regencyName || "all"}
                        onValueChange={(value) => handleFilterUpdate("regencyName", value)}
                        disabled={isLoadingRegencies}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Pilih Kota/Kabupaten" />
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
                <Label className="text-sm font-semibold">💰 Rentang Harga</Label>
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
                            className="justify-start text-xs rounded-xl h-9"
                            onClick={() => handlePriceRangeSelect(range.min, range.max)}
                        >
                            {range.label}
                        </Button>
                    ))}
                </div>

                {/* Custom Price Range */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Minimal</Label>
                        <Input
                            type="number"
                            placeholder="Rp 0"
                            value={filters.minPrice || ""}
                            onChange={(e) => handleFilterUpdate("minPrice", e.target.value || undefined)}
                            className="rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Maksimal</Label>
                        <Input
                            type="number"
                            placeholder="Tidak terbatas"
                            value={filters.maxPrice || ""}
                            onChange={(e) => handleFilterUpdate("maxPrice", e.target.value || undefined)}
                            className="rounded-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            {activeFilterCount > 0 && (
                <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={resetFilters}
                >
                    <X className="mr-2 h-4 w-4" />
                    Reset Filter ({activeFilterCount})
                </Button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <PublicHeader />

            <main className="flex-1">
                {/* Hero Search Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12 sm:py-16 lg:py-20">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                    </div>

                    <div className="container mx-auto px-4 sm:px-6 relative">
                        <div className="max-w-3xl mx-auto text-center space-y-6">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                                
                                <span>Temukan Kos Terbaik</span>
                            </div>

                            {/* Heading */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                                Cari{" "}
                                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    Kos Impianmu
                                </span>
                            </h1>

                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Ribuan pilihan kos dengan berbagai fasilitas dan harga terjangkau tersedia untuk Anda
                            </p>

                            {/* Search Form */}
                            <form onSubmit={handleSearch} className="mt-8">
                                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Cari nama kos, lokasi, atau fasilitas..."
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            className="pl-12 h-12 sm:h-14 rounded-full text-base border-2 border-border/50 focus:border-primary bg-background/80 backdrop-blur-sm"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="h-12 sm:h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
                                    >
                                        <Search className="mr-2 h-5 w-5" />
                                        Cari
                                    </Button>
                                </div>
                            </form>

                            {/* Quick Stats */}
                            <div className="flex items-center justify-center gap-6 sm:gap-10 pt-4">
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-bold text-primary">{totalResults}+</div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">Kos Tersedia</div>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-bold text-primary">{provinces.length}+</div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">Provinsi</div>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">Support</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <section className="py-8 sm:py-12 bg-muted/20">
                    <div className="container mx-auto px-4 sm:px-6">
                        {/* Top Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-semibold">
                                    {totalResults} Kos Ditemukan
                                </h2>
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="rounded-full">
                                        {activeFilterCount} filter aktif
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Sort */}
                                <Select
                                    value={
                                        filters.sortBy === "price" && filters.sortOrder === "desc"
                                            ? "price_desc"
                                            : filters.sortBy === "createdAt"
                                                ? "newest"
                                                : "price_asc"
                                    }
                                    onValueChange={handleSortChange}
                                >
                                    <SelectTrigger className="w-[160px] rounded-full">
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

                                {/* Mobile Filter Button */}
                                <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "lg:hidden rounded-full gap-2",
                                                activeFilterCount > 0 && "border-primary text-primary"
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
                                                Sesuaikan pencarian dengan filter berikut
                                            </SheetDescription>
                                        </SheetHeader>
                                        <div className="mt-6">
                                            <FilterSidebar mobile />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="flex gap-8">
                            {/* Desktop Sidebar */}
                            <aside className="hidden lg:block w-72 shrink-0">
                                <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
                                    <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-primary" />
                                        Filter
                                    </h3>
                                    <FilterSidebar />
                                </div>
                            </aside>

                            {/* Property Grid */}
                            <div className="flex-1 min-w-0">
                                {/* Error State */}
                                {error && (
                                    <Alert variant="destructive" className="mb-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Loading State */}
                                {isLoading && properties.length === 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <PropertyCardSkeleton key={i} />
                                        ))}
                                    </div>
                                ) : properties.length === 0 ? (
                                    /* Empty State */
                                    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background p-8 text-center">
                                        <div className="mx-auto max-w-md space-y-4">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                                <Building2 className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xl font-semibold">
                                                Tidak ada kos ditemukan
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Coba ubah kata kunci atau filter pencarian untuk melihat lebih banyak hasil.
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={resetFilters}
                                                className="mt-4 rounded-full"
                                            >
                                                Reset Filter
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Property Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                                            <div className="mt-10 flex justify-center">
                                                <Button
                                                    onClick={handleLoadMore}
                                                    disabled={isLoadingMore}
                                                    size="lg"
                                                    variant="outline"
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
                                        <div className="mt-6 text-center text-sm text-muted-foreground">
                                            Menampilkan {properties.length} dari {totalResults} kos
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
}

function PropertyCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <Skeleton className="h-36 w-full" />
            <div className="space-y-4 p-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-32" />
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

export default function CariKosPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CariKosContent />
        </Suspense>
    );
}
