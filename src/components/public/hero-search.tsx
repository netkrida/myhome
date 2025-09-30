"use client";

import { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { Search, MapPin, Users, Sparkles, UserRoundCheck, Venus, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type HeroTabBadgeTone = "info" | "danger" | "success";

type HeroTab = {
  id: string;
  label: string;
  icon?: LucideIcon;
  iconSrc?: string;
  iconAlt?: string;
  gradient: string;
  iconColor: string;
  badge?: {
    label: string;
    tone?: HeroTabBadgeTone;
  };
};

const HERO_TAB_ITEMS: HeroTab[] = [
  {
    id: "KOS_ALL",
    label: "Cari Kos",
    icon: MapPin,
    iconAlt: "Ikon cari kos",
    gradient: "from-sky-400 via-blue-400 to-blue-600",
    iconColor: "text-blue-600",
  },
  {
    id: "KOS_PUTRA",
    label: "Kos Putra",
    icon: UserRoundCheck,
    iconAlt: "Ikon kos putra",
    gradient: "from-indigo-400 via-blue-500 to-indigo-600",
    iconColor: "text-indigo-600",
  },
  {
    id: "KOS_PUTRI",
    label: "Kos Putri",
    icon: Venus,
    iconAlt: "Ikon kos putri",
    gradient: "from-pink-400 via-rose-400 to-pink-600",
    iconColor: "text-rose-500",
  },
  {
    id: "KOS_CAMPUR",
    label: "Kos Campur",
    icon: Users,
    iconAlt: "Ikon kos campur",
    gradient: "from-purple-400 via-violet-500 to-purple-600",
    iconColor: "text-purple-500",
  },
];


export function HeroSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [activeTab, setActiveTab] = useState("KOS_ALL");

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const node = scrollContainerRef.current;

    if (!node) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = node;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    const node = scrollContainerRef.current;

    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();

    updateScrollState();

    if (node) {
      node.addEventListener("scroll", handleScroll);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      if (node) {
        node.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scrollTabs = (direction: "left" | "right") => {
    const node = scrollContainerRef.current;

    if (!node) {
      return;
    }

    const scrollAmount = direction === "left" ? -220 : 220;
    node.scrollBy({ left: scrollAmount, behavior: "smooth" });

    window.setTimeout(updateScrollState, 260);
  };

  const popularLocations = [
    "Malang", "Yogyakarta", "Bandung", "Surabaya", "Jakarta Selatan", "Semarang", "Depok", "Bogor"
  ];

  const handleSearch = () => {
    // Handle search logic here
    console.log("Search:", { searchQuery, location, propertyType, priceRange });
  };

  return (
    <section
      className="relative text-white pt-8 pb-20 overflow-hidden"
      style={{
        backgroundImage: `url('/pexels-maxfrancis-2246476.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay Gradient */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 opacity-80 pointer-events-none z-0" /> */}
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-10">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      <div className="container mx-auto px-4 relative z-30">
        {/* Hero Text */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg transition-all duration-500">
            Hai kamu, mau ke mana?
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-2">
            myhome - Satu aplikasi untuk kebutuhan hunianmu.
          </p>
          <p className="text-lg text-blue-200">
            Temukan kos impianmu dengan mudah dan cepat
          </p>
        </div>

        {/* Search Card */}
        <div className="flex justify-center">
          <Card className="relative w-full max-w-[1100px] overflow-visible rounded-[36px] border border-white/50 bg-white/95 shadow-2xl backdrop-blur">
            <div className="absolute left-1/2 -top-12 z-30 flex w-full -translate-x-1/2 justify-center px-4">
              <div className="flex w-full max-w-[860px] items-center gap-2.5 rounded-full border border-white/70 bg-white/95 px-4 py-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => scrollTabs("left")}
                  aria-label="Gulir kiri"
                  disabled={!canScrollLeft}
                  className={cn(
                    "hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg shadow-blue-500/10 transition-all duration-300",
                    "hover:bg-blue-50",
                    "disabled:opacity-0 disabled:pointer-events-none"
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div
                  ref={scrollContainerRef}
                  className="flex w-full flex-1 items-center gap-3 overflow-x-auto px-1 py-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {HERO_TAB_ITEMS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        aria-pressed={isActive}
                        className={cn(
                          "group relative flex min-w-[130px] items-start gap-2.5 rounded-full px-4 sm:px-5 pt-4 pb-1.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                          "hover:-translate-y-0.5",
                          isActive
                            ? "bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : "bg-transparent text-gray-600 hover:bg-blue-50"
                        )}
                      >
                        <span
                          className={cn(
                            "relative flex h-8 w-8 -translate-y-4 items-center justify-center overflow-hidden rounded-full transition-all duration-300 ring-3 ring-white/90",
                            isActive ? "shadow-lg shadow-blue-500/40" : "shadow-sm"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute inset-0 rounded-full bg-gradient-to-br transition-opacity duration-300",
                              tab.gradient,
                              isActive ? "opacity-100" : "opacity-90 group-hover:opacity-100"
                            )}
                          />
                          <span className="absolute inset-x-1.5 top-1 h-1 rounded-full bg-white/70 opacity-70 blur-[1px]" />
                          <span className="absolute inset-x-2 bottom-0.5 h-1.5 rounded-full bg-black/25 opacity-20 blur-[4px] group-hover:opacity-30" />
                          {tab.iconSrc ? (
                            <Image
                              src={tab.iconSrc}
                              alt={tab.iconAlt ?? tab.label}
                              width={24}
                              height={24}
                              className="relative z-10 h-6 w-6 object-contain"
                            />
                          ) : Icon ? (
                            <Icon
                              className={cn(
                                "relative z-10 h-4 w-4 transition-colors duration-300",
                                isActive ? "text-white" : tab.iconColor
                              )}
                            />
                          ) : null}
                        </span>
                        <span className="flex flex-1 items-start gap-2 -mt-1">
                          <span
                            className={cn(
                              "whitespace-nowrap transition-colors duration-300 leading-tight",
                              isActive ? "text-white" : "text-gray-700 group-hover:text-blue-600"
                            )}
                          >
                            {tab.label}
                          </span>
                          {tab.badge ? (
                            <span
                              className={cn(
                                "mt-0.5 rounded-full px-2 py-[2px] text-xs font-semibold uppercase tracking-tight shadow-sm",
                                tab.badge.tone === "danger"
                                  ? "bg-red-500 text-white"
                                  : tab.badge.tone === "success"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {tab.badge.label}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => scrollTabs("right")}
                  aria-label="Gulir kanan"
                  disabled={!canScrollRight}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg shadow-blue-500/10 transition-all duration-300",
                    "hover:bg-blue-50",
                    "disabled:opacity-30 disabled:shadow-none"
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <CardContent className="px-6 pt-14 pb-8 md:px-8">
              <div className="mx-auto w-full max-w-[1280px]">
                <div className="grid items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-blue-100/70 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] lg:gap-2 lg:[&>div]:px-4 lg:[&>div:not(:last-child)]:border-r lg:[&>div:not(:last-child)]:border-blue-100/80">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="flex w-full flex-col">
                      <label htmlFor="hero-location" className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">Lokasi</label>
                      <Input
                        id="hero-location"
                        placeholder="Pilih"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-12 w-full border-none bg-transparent px-0 text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                      <Search className="h-4 w-4" />
                    </span>
                    <div className="flex w-full flex-col">
                      <label htmlFor="hero-search" className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">Nama kos</label>
                      <Input
                        id="hero-search"
                        placeholder="Cari"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full border-none bg-transparent px-0 text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                      <Users className="h-4 w-4" />
                    </span>
                    <div className="flex w-full flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">Tipe kos</span>
                      <Select value={propertyType} onValueChange={setPropertyType}>
                        <SelectTrigger className="h-12 w-full border-none bg-transparent px-0 text-sm font-semibold text-gray-700 shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-gray-400">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-blue-100">
                          <SelectItem value="KOS_PUTRA">Kos Putra</SelectItem>
                          <SelectItem value="KOS_PUTRI">Kos Putri</SelectItem>
                          <SelectItem value="KOS_CAMPUR">Kos Campur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                      <Wallet className="h-4 w-4" />
                    </span>
                    <div className="flex w-full flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">Rentang harga</span>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger className="h-12 w-full border-none bg-transparent px-0 text-sm font-semibold text-gray-700 shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-gray-400">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-blue-100">
                          <SelectItem value="0-1000000">&lt; Rp 1 Juta</SelectItem>
                          <SelectItem value="1000000-2000000">Rp 1-2 Juta</SelectItem>
                          <SelectItem value="2000000-3000000">Rp 2-3 Juta</SelectItem>
                          <SelectItem value="3000000+">&gt; Rp 3 Juta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex w-full justify-center sm:justify-end">
                    <Button
                      onClick={handleSearch}
                      className="h-12 min-w-[140px] rounded-2xl bg-blue-600 px-6 text-sm font-semibold shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-0.5 hover:bg-blue-700 sm:w-full lg:w-auto"
                    >
                      Cari Kos
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-blue-100/70 pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <span className="max-w-xl">
                    Yuk, cek ada promo apa saja yang bisa kamu pakai biar hemat!
                  </span>
                </div>
                <Button variant="link" className="p-0 text-blue-600 hover:text-blue-700">
                  Cek promonya sekarang!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Locations */}
        <div className="max-w-5xl mx-auto mt-8">
          <div className="text-center mb-4">
            <p className="text-blue-100">Lokasi populer:</p>
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap justify-center gap-2">
              {popularLocations.map((loc) => (
                <Tooltip key={loc}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all shadow hover:scale-105"
                      onClick={() => setLocation(loc)}
                    >
                      {loc}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Cari kos di {loc}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>
      {/* Animasi fade-in */}
      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(.39,.575,.565,1) both;
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}



