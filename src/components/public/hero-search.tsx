"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, Users, Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HeroSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [activeTab, setActiveTab] = useState("KOS_ALL");

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
        <Card className="max-w-5xl mx-auto shadow-2xl border-0 animate-fade-in-up transition-all duration-500">
          <CardContent className="p-6">
            {/* Search Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant={activeTab === "KOS_ALL" ? "default" : "outline"}
                className={`px-4 py-2 cursor-pointer transition-all ${activeTab === "KOS_ALL" ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-gray-50 text-blue-700"}`}
                onClick={() => setActiveTab("KOS_ALL")}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Cari Kos
              </Badge>
              <Badge
                variant={activeTab === "KOS_PUTRA" ? "default" : "outline"}
                className={`px-4 py-2 cursor-pointer transition-all ${activeTab === "KOS_PUTRA" ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-gray-50 text-blue-700"}`}
                onClick={() => setActiveTab("KOS_PUTRA")}
              >
                <Users className="h-4 w-4 mr-2" />
                Kos Putra
              </Badge>
              <Badge
                variant={activeTab === "KOS_PUTRI" ? "default" : "outline"}
                className={`px-4 py-2 cursor-pointer transition-all ${activeTab === "KOS_PUTRI" ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-gray-50 text-blue-700"}`}
                onClick={() => setActiveTab("KOS_PUTRI")}
              >
                <Users className="h-4 w-4 mr-2" />
                Kos Putri
              </Badge>
              <Badge
                variant={activeTab === "KOS_CAMPUR" ? "default" : "outline"}
                className={`px-4 py-2 cursor-pointer transition-all ${activeTab === "KOS_CAMPUR" ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-gray-50 text-blue-700"}`}
                onClick={() => setActiveTab("KOS_CAMPUR")}
              >
                <Users className="h-4 w-4 mr-2" />
                Kos Campur
              </Badge>
            </div>

            {/* Search Form */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Lokasi</label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    placeholder="Mau ke mana?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipe Kos</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500 transition-all">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KOS_PUTRA">Kos Putra</SelectItem>
                    <SelectItem value="KOS_PUTRI">Kos Putri</SelectItem>
                    <SelectItem value="KOS_CAMPUR">Kos Campur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Harga</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500 transition-all">
                    <SelectValue placeholder="Range harga" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1000000">&lt; Rp 1 Juta</SelectItem>
                    <SelectItem value="1000000-2000000">Rp 1-2 Juta</SelectItem>
                    <SelectItem value="2000000-3000000">Rp 2-3 Juta</SelectItem>
                    <SelectItem value="3000000+">&gt; Rp 3 Juta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="space-y-2 flex flex-col justify-end">
                <label className="text-sm font-medium text-gray-700 opacity-0">Search</label>
                <Button 
                  onClick={handleSearch}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10 transition-all shadow-md hover:scale-105"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Cari Kos
                </Button>
              </div>
            </div>

            {/* Advanced Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 flex items-center gap-2">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Lanjutan
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-white text-gray-800 shadow-lg rounded-lg">
                  <div className="font-semibold mb-2">Filter Lanjutan</div>
                  {/* Tambahkan filter lanjutan di sini */}
                  <div className="space-y-2">
                    <Input placeholder="Fasilitas (AC, Wifi, dll)" className="w-full" />
                    <Input placeholder="Jarak ke kampus" className="w-full" />
                    {/* ...tambahkan filter lain sesuai kebutuhan... */}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="text-sm text-gray-500 text-center sm:text-right flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-bounce" />
                Yuk, cek ada promo apa saja yang bisa kamu pakai biar hemat!{" "}
                <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                  Cek promonya sekarang!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
