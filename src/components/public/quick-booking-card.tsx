"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MessageCircle, MapPin, Sparkles, Info } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import { cn } from "@/lib/utils";
import { formatCurrency } from "./property-detail-utils";

interface QuickBookingCardProps {
  property: PublicPropertyDetailDTO;
  adminWa?: string | null;
}

type PricePeriod = "monthly" | "daily" | "weekly" | "quarterly" | "yearly";

const PRICE_PERIOD_LABELS: Record<PricePeriod, string> = {
  monthly: "Bulanan",
  daily: "Harian",
  weekly: "Mingguan",
  quarterly: "3 Bulan",
  yearly: "Tahunan",
};

export function QuickBookingCard({ property, adminWa }: QuickBookingCardProps) {
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [pricePeriod, setPricePeriod] = useState<PricePeriod>("monthly");
  const [startDate, setStartDate] = useState<Date>();

  // Group rooms by room type for select options
  const roomTypeOptions = useMemo(() => {
    const grouped = property.rooms.reduce((acc, room) => {
      if (!acc[room.roomType]) {
        acc[room.roomType] = {
          roomType: room.roomType,
          availableCount: 0,
          rooms: [],
        };
      }
      const group = acc[room.roomType];
      if (group) {
        group.rooms.push(room);
        if (room.isAvailable) {
          group.availableCount++;
        }
      }
      return acc;
    }, {} as Record<string, { roomType: string; availableCount: number; rooms: typeof property.rooms }>);

    return Object.values(grouped);
  }, [property.rooms]);

  // Get selected room details
  const selectedRoom = useMemo(() => {
    if (!selectedRoomType) return null;
    const roomGroup = roomTypeOptions.find(opt => opt.roomType === selectedRoomType);
    if (!roomGroup || roomGroup.rooms.length === 0) return null;
    return roomGroup.rooms[0]; // Use first room as representative
  }, [selectedRoomType, roomTypeOptions]);

  // Calculate price based on period
  const calculatedPrice = useMemo(() => {
    if (!selectedRoom) return 0;

    switch (pricePeriod) {
      case "monthly":
        return selectedRoom.monthlyPrice;
      case "daily":
        return selectedRoom.dailyPrice || 0;
      case "weekly":
        return selectedRoom.weeklyPrice || 0;
      case "quarterly":
        return selectedRoom.quarterlyPrice || 0;
      case "yearly":
        return selectedRoom.yearlyPrice || 0;
      default:
        return selectedRoom.monthlyPrice;
    }
  }, [selectedRoom, pricePeriod]);

  // Calculate deposit
  const depositAmount = useMemo(() => {
    if (!selectedRoom || !selectedRoom.depositRequired) return 0;

    if (selectedRoom.depositType === "FIXED") {
      return selectedRoom.depositValue || 0;
    } else if (selectedRoom.depositType === "PERCENTAGE") {
      const percentage = selectedRoom.depositValue || 0;
      return (calculatedPrice * percentage) / 100;
    }

    // Default: 1 month
    return selectedRoom.monthlyPrice;
  }, [selectedRoom, calculatedPrice]);

  // Get available price periods for selected room
  const availablePeriods = useMemo(() => {
    if (!selectedRoom) return ["monthly"];

    const periods: PricePeriod[] = ["monthly"];
    if (selectedRoom.dailyPrice && selectedRoom.dailyPrice > 0) periods.push("daily");
    if (selectedRoom.weeklyPrice && selectedRoom.weeklyPrice > 0) periods.push("weekly");
    if (selectedRoom.quarterlyPrice && selectedRoom.quarterlyPrice > 0) periods.push("quarterly");
    if (selectedRoom.yearlyPrice && selectedRoom.yearlyPrice > 0) periods.push("yearly");

    return periods;
  }, [selectedRoom]);

  // Get cheapest price
  const cheapestPrice = useMemo(() => {
    if (property.rooms.length === 0) return 0;
    return Math.min(...property.rooms.map(room => room.monthlyPrice));
  }, [property.rooms]);

  const totalAmount = calculatedPrice + depositAmount;

  const canBook = !!(selectedRoomType && calculatedPrice > 0 && startDate);

  // WhatsApp message
  const whatsappMessage = useMemo(() => {
    const baseMessage = `Halo Admin, saya tertarik dengan properti "${property.name}"`;

    if (selectedRoomType && startDate) {
      return `${baseMessage}%0A%0ATipe Kamar: ${selectedRoomType}%0APeriode: ${PRICE_PERIOD_LABELS[pricePeriod]}%0ATanggal Mulai: ${format(startDate, "dd MMMM yyyy", { locale: id })}%0A%0AApakah kamar tersedia?`;
    }

    return `${baseMessage}.%0AApakah ada kamar yang tersedia?`;
  }, [property.name, selectedRoomType, pricePeriod, startDate]);

  const whatsappUrl = adminWa ? `https://wa.me/${adminWa}?text=${whatsappMessage}` : null;

  return (
    <Card className="sticky top-24 border-2 shadow-lg transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/50">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Mulai dari</div>
            <CardTitle className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(cheapestPrice)}
            </CardTitle>
            <div className="text-xs text-muted-foreground">/bulan</div>
          </div>
          <Badge className="bg-blue-500 text-white dark:bg-blue-600">
            <Sparkles className="mr-1 h-3 w-3" />
            Promo
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4 pt-6">
        {/* Room Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Pilih Tipe Kamar</label>
          <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih tipe kamar..." />
            </SelectTrigger>
            <SelectContent>
              {roomTypeOptions.map((option) => (
                <SelectItem key={option.roomType} value={option.roomType}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{option.roomType}</span>
                    <Badge variant={option.availableCount > 0 ? "default" : "secondary"} className="ml-2 text-xs">
                      {option.availableCount > 0 ? `${option.availableCount} tersedia` : "Penuh"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Period Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Periode Sewa</label>
          <Select
            value={pricePeriod}
            onValueChange={(value) => setPricePeriod(value as PricePeriod)}
            disabled={!selectedRoomType}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih periode..." />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map((period) => (
                <SelectItem key={period} value={period}>
                  {PRICE_PERIOD_LABELS[period as PricePeriod]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tanggal Mulai</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                disabled={!selectedRoomType}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={id}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Price Breakdown */}
        {selectedRoom && calculatedPrice > 0 && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Harga Sewa</span>
              <span className="font-semibold text-foreground">{formatCurrency(calculatedPrice)}</span>
            </div>

            {selectedRoom.depositRequired && depositAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Deposit</span>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(depositAmount)}</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {selectedRoom.depositRequired && (
              <p className="text-xs text-muted-foreground">
                <Info className="mr-1 inline h-3 w-3" />
                Deposit akan dikembalikan saat checkout
              </p>
            )}
          </div>
        )}

        {/* Booking Button */}
        <Button
          asChild={canBook}
          disabled={!canBook}
          className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-6 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400"
          size="lg"
        >
          {canBook ? (
            <Link href={`/booking/${property.id}?roomType=${encodeURIComponent(selectedRoomType)}&period=${pricePeriod}&startDate=${startDate?.toISOString()}`}>
              Pesan Sekarang
            </Link>
          ) : (
            <span>Isi Data untuk Lanjut</span>
          )}
        </Button>

        {/* WhatsApp Contact */}
        {whatsappUrl && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">atau</span>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full rounded-full border-green-200 bg-green-50 py-6 text-green-700 transition-colors hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
              size="lg"
            >
              <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Hubungi via WhatsApp
              </Link>
            </Button>
          </>
        )}

        {/* Property Location Info */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
            <div>
              <div className="font-medium text-foreground">{property.location.districtName}</div>
              <div>{property.location.regencyName}, {property.location.provinceName}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
