import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import { BedDouble, DoorOpen, MapPin, Ruler, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import type { DetailFacility } from "./property-detail-utils";
import {
  formatCurrency,
  formatDeposit,
  groupFacilitiesByCategory,
  orderedFacilityEntries,
  resolveFacilityLabel,
  magicCardClass,
} from "./property-detail-utils";

interface PropertyDetailRoomsProps {
  property: PublicPropertyDetailDTO;
  roomCountLabel: string;
}

export function PropertyDetailRooms({ property, roomCountLabel }: PropertyDetailRoomsProps) {
  // Group rooms by room type
  const groupedRooms = property.rooms.reduce((acc, room) => {
    if (!acc[room.roomType]) {
      acc[room.roomType] = [];
    }
    acc[room.roomType]!.push(room);
    return acc;
  }, {} as Record<string, typeof property.rooms>);

  // Create room type summaries
  const roomTypeSummaries = Object.entries(groupedRooms).map(([roomType, rooms]) => {
    const availableRooms = rooms.filter(room => room.isAvailable).length;
    const totalRooms = rooms.length;
    const minPrice = Math.min(...rooms.map(room => room.monthlyPrice));
    const maxPrice = Math.max(...rooms.map(room => room.monthlyPrice));
    const representativeRoom = rooms[0]; // Use first room as representative for facilities, images, etc.

    return {
      roomType,
      rooms,
      availableRooms,
      totalRooms,
      minPrice,
      maxPrice,
      representativeRoom,
      priceRange: minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
    };
  });

  if (roomTypeSummaries.length === 0) {
    return (
      <section className="space-y-6 transition-colors">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Daftar Kamar</h2>
            <p className="text-sm text-muted-foreground">Pilihan kamar tersedia lengkap dengan fasilitas dan harga.</p>
          </div>
          <Badge className="rounded-full border border-border/60 bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {roomCountLabel}
          </Badge>
        </div>

        <Card className={magicCardClass}>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            Belum ada kamar yang dapat ditampilkan untuk saat ini.
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6 transition-colors">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Daftar Kamar</h2>
          <p className="text-sm text-muted-foreground">Pilihan kamar tersedia lengkap dengan fasilitas dan harga.</p>
        </div>
        <div className="flex items-center gap-2">
          {property.availableRooms > 0 && property.availableRooms < 5 && (
            <Badge className="rounded-full border-amber-300/70 bg-amber-500 px-3 py-1 text-xs font-semibold text-white dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Sisa {property.availableRooms} kamar
            </Badge>
          )}
          <Badge
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              property.availableRooms > 0
                ? "border-emerald-300/70 bg-emerald-500 text-white dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "border-border/60 bg-muted text-muted-foreground"
            }`}
          >
            {roomCountLabel}
          </Badge>
        </div>
      </div>

      {/* Desktop View - Vertical Stack */}
      <div className="hidden space-y-6 lg:block">
        {roomTypeSummaries.map((summary) => {
          const room = summary.representativeRoom;
          if (!room) return null;

          const facilities = Array.isArray(room.facilities) ? (room.facilities as DetailFacility[]) : [];
          const roomFacilityEntries = facilities.length > 0 ? orderedFacilityEntries(groupFacilitiesByCategory(facilities)) : [];
          const primaryImage = [...room.images].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
          const highlightFacilities = facilities.slice(0, 8);
          const dailyPrice = room.dailyPrice ? formatCurrency(room.dailyPrice) : null;

          return (
            <Card key={summary.roomType} className={`${magicCardClass} overflow-hidden`}>
              <CardContent className="flex flex-col gap-6 p-5 transition-colors md:flex-row md:items-stretch md:gap-8">
                <div className="md:w-64">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.imageUrl}
                        alt={primaryImage.caption ?? `${room.roomType} - ${property.name}`}
                        fill
                        sizes="(min-width: 1024px) 260px, 50vw"
                        className="object-cover transition duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground/60">
                        <BedDouble className="h-10 w-10" />
                      </div>
                    )}
                    {room.images.length > 0 && (
                      <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white shadow">
                        1/{room.images.length}
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-col gap-2">
                      <Badge className="flex items-center gap-2 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground/80">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        {summary.availableRooms > 0 ? "Best pick" : "Fully booked"}
                      </Badge>
                      {summary.availableRooms > 0 && summary.availableRooms < 5 && (
                        <Badge className="flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white">
                          <AlertTriangle className="h-3 w-3" />
                          Sisa {summary.availableRooms}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">{room.roomType}</h3>
                        <CardDescription className="space-x-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <BedDouble className="h-4 w-4 text-blue-500" />
                            {room.roomType}
                          </span>
                          {room.size && (
                            <span className="inline-flex items-center gap-1">
                              <Ruler className="h-4 w-4 text-blue-500" />
                              {room.size}
                            </span>
                          )}
                        </CardDescription>
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          {property.location.districtName}, {property.location.regencyName}
                        </div>
                        {room.description && (
                          <p className="text-sm text-muted-foreground">{room.description}</p>
                        )}
                      </div>

                      <Badge
                        className={`w-fit rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                          summary.availableRooms > 0
                            ? "border-emerald-300/70 bg-emerald-500 text-white dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200"
                            : "border-border/60 bg-muted text-muted-foreground"
                        }`}
                      >
                        {summary.availableRooms > 0 ? "Tersedia" : "Tidak tersedia"}
                      </Badge>
                    </div>

                    {highlightFacilities.length > 0 && (
                      <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">Fasilitas Unggulan</div>
                        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          {highlightFacilities.map((facility) => (
                            <li key={facility.id} className="flex items-start gap-2">
                              <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                              <span>{facility.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {roomFacilityEntries.length > 0 && (
                      <details className="group rounded-2xl border border-border/60 bg-card/70 p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-blue-600 transition group-open:text-blue-700 dark:text-blue-300 dark:group-open:text-blue-200">
                          Lihat semua fasilitas
                        </summary>
                        <div className="mt-3 space-y-4 text-sm text-muted-foreground">
                          {roomFacilityEntries.map(([category, items]) => (
                            <div key={category} className="space-y-2">
                              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
                                {resolveFacilityLabel(category)}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {items.map((facility) => (
                                  <Badge
                                    key={facility.id}
                                    variant="outline"
                                    className="rounded-full border-border bg-card px-3 py-1 text-[13px] text-muted-foreground"
                                  >
                                    {facility.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm transition-colors md:grid-cols-[1.2fr_minmax(0,1fr)]">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">Ketentuan Deposit</div>
                          <div className="mt-1 font-medium text-foreground">{formatDeposit(room)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DoorOpen className="mt-0.5 h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">Status Kamar</div>
                          <div className="mt-1 space-y-1">
                            <div className="font-medium text-foreground">
                              {summary.availableRooms > 0 ? "Siap disewa" : "Sedang tidak tersedia"}
                            </div>
                            {summary.availableRooms > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {summary.availableRooms < 5
                                  ? `Hanya tersisa ${summary.availableRooms} kamar tersedia`
                                  : `${summary.availableRooms} kamar tersedia`
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {dailyPrice && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Promo harian mulai {dailyPrice}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3 text-right">
                      <div className="space-y-1">
                        <div className="text-xl font-semibold text-rose-600 dark:text-rose-300">{summary.priceRange}</div>
                        <div className="text-xs text-muted-foreground">/bulan (harga belum termasuk pajak)</div>
                        {dailyPrice && (
                          <div className="text-[13px] text-muted-foreground">Tarif harian: {dailyPrice}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {summary.availableRooms > 0
                            ? `${summary.availableRooms} dari ${summary.totalRooms} kamar tersedia`
                            : `${summary.totalRooms} kamar (semua terisi)`
                          }
                        </div>
                      </div>
                      <Button size="lg" className="w-full max-w-[160px] rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                        Pesan
                      </Button>
                      <Link
                        href={`/rooms/${property.id}?roomType=${encodeURIComponent(summary.roomType)}&includeOccupied=true`}
                        className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                      >
                        Lihat detail
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile & Tablet View - Horizontal Scroll */}
      <div className="block lg:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {roomTypeSummaries.map((summary) => {
            const room = summary.representativeRoom;
            if (!room) return null;

            const facilities = Array.isArray(room.facilities) ? (room.facilities as DetailFacility[]) : [];
            const primaryImage = [...room.images].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
            const highlightFacilities = facilities.slice(0, 4);
            const dailyPrice = room.dailyPrice ? formatCurrency(room.dailyPrice) : null;

            return (
              <Card key={summary.roomType} className={`${magicCardClass} w-80 flex-shrink-0 overflow-hidden`}>
                <CardContent className="p-4">
                  {/* Image Section */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.imageUrl}
                        alt={primaryImage.caption ?? `${room.roomType} - ${property.name}`}
                        fill
                        sizes="320px"
                        className="object-cover transition duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground/60">
                        <BedDouble className="h-8 w-8" />
                      </div>
                    )}
                    {room.images.length > 0 && (
                      <div className="absolute right-2 top-2 inline-flex items-center rounded-full bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white shadow">
                        1/{room.images.length}
                      </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      <Badge className="flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold text-foreground/80">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        {summary.availableRooms > 0 ? "Terbaik" : "Penuh"}
                      </Badge>
                      {summary.availableRooms > 0 && summary.availableRooms < 5 && (
                        <Badge className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-1 text-xs font-semibold text-white">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Sisa {summary.availableRooms}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="mt-4 space-y-3">
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-foreground">{room.roomType}</h3>
                        <Badge
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            room.isAvailable
                              ? "border-emerald-300/70 bg-emerald-500 text-white dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200"
                              : "border-border/60 bg-muted text-muted-foreground"
                          }`}
                        >
                          {room.isAvailable ? "Tersedia" : "Penuh"}
                        </Badge>
                      </div>

                      <CardDescription className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-blue-500" />
                          <span>{room.roomType}</span>
                          {room.size && (
                            <>
                              <span>•</span>
                              <Ruler className="h-3.5 w-3.5 text-blue-500" />
                              <span>{room.size}</span>
                            </>
                          )}
                        </div>
                      </CardDescription>

                      {room.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>
                      )}
                    </div>

                    {/* Facilities */}
                    {highlightFacilities.length > 0 && (
                      <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80 mb-2">Fasilitas</div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                          {highlightFacilities.map((facility) => (
                            <div key={facility.id} className="flex items-center gap-1">
                              <span className="inline-flex h-1 w-1 rounded-full bg-blue-500" />
                              <span className="truncate">{facility.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="rounded-xl border border-border/70 bg-card/90 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-rose-600 dark:text-rose-300">{summary.priceRange}</div>
                          <div className="text-xs text-muted-foreground">/bulan</div>
                          {dailyPrice && (
                            <div className="text-xs text-muted-foreground">Harian: {dailyPrice}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {summary.availableRooms > 0
                              ? `${summary.availableRooms}/${summary.totalRooms} tersedia`
                              : `${summary.totalRooms} kamar (penuh)`
                            }
                          </div>
                        </div>
                        <Button size="sm" className="rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                          Pesan
                        </Button>
                      </div>

                      {summary.availableRooms > 0 && summary.availableRooms < 5 && (
                        <div className="mt-2 text-xs text-amber-600 font-medium">
                          ⚠️ Hanya tersisa {summary.availableRooms} kamar
                        </div>
                      )}

                      <div className="mt-2 text-center">
                        <Link
                          href={`/rooms/${property.id}?roomType=${encodeURIComponent(summary.roomType)}&includeOccupied=true`}
                          className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                        >
                          Lihat detail kamar
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


