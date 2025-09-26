"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function HeroSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const popularLocations = [
    "Malang", "Yogyakarta", "Bandung", "Surabaya", "Jakarta Selatan", "Semarang", "Depok", "Bogor"
  ];

  const handleSearch = () => {
    // Handle search logic here
    console.log("Search:", { searchQuery, location, propertyType, priceRange });
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white pt-8 pb-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="container mx-auto px-4 relative">
        {/* Hero Text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Hai kamu, mau ke mana?
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-2">
            MultiKost - Satu aplikasi untuk kebutuhan hunianmu.
          </p>
          <p className="text-lg text-blue-200">
            Temukan kos impianmu dengan mudah dan cepat
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-5xl mx-auto shadow-2xl border-0">
          <CardContent className="p-6">
            {/* Search Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 px-4 py-2">
                <MapPin className="h-4 w-4 mr-2" />
                Cari Kos
              </Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-gray-50">
                <Users className="h-4 w-4 mr-2" />
                Kos Putra
              </Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-gray-50">
                <Users className="h-4 w-4 mr-2" />
                Kos Putri
              </Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-gray-50">
                <Users className="h-4 w-4 mr-2" />
                Kos Campur
              </Badge>
            </div>

            {/* Search Form */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Lokasi</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Mau ke mana?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipe Kos</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 opacity-0">Search</label>
                <Button 
                  onClick={handleSearch}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Cari Kos
                </Button>
              </div>
            </div>

            {/* Advanced Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter Lanjutan
              </Button>

              <div className="text-sm text-gray-500 text-center sm:text-right">
                Yuk, cek ada promo apa saja yang bisa kamu pakai biar hemat!{" "}
                <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                  Cek promoya sekarang!
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
          <div className="flex flex-wrap justify-center gap-2">
            {popularLocations.map((loc) => (
              <Button
                key={loc}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                onClick={() => setLocation(loc)}
              >
                {loc}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
