import type { ReactNode } from "react";
import { Bath, BedDouble, Car, CheckCircle2 } from "lucide-react";
import type { PropertyImageDTO, PublicPropertyRoomDTO } from "@/server/types/property";
import { ImageCategory, PropertyType } from "@/server/types/property";

export type DetailFacility = { id: string; name: string; category?: string };
export type PricingEntry = { label: string; value?: number | null; highlight?: boolean };
export type ImageCategoryKey = ImageCategory | "OTHER";

const propertyTypeMeta: Record<PropertyType, { label: string; description: string; badgeClass: string }> = {
  [PropertyType.MALE_ONLY]: {
    label: "Kos Putra",
    description: "Hunian khusus penyewa laki-laki",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
  [PropertyType.FEMALE_ONLY]: {
    label: "Kos Putri",
    description: "Hunian khusus penyewa perempuan",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
  },
  [PropertyType.MIXED]: {
    label: "Kos Campur",
    description: "Hunian untuk penyewa laki-laki maupun perempuan",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
};

const facilityCategoryLabels: Record<string, string> = {
  property: "Fasilitas Properti",
  parking: "Fasilitas Parkir",
  room: "Fasilitas Kamar",
  bathroom: "Fasilitas Kamar Mandi",
  other: "Fasilitas Tambahan",
};

const facilityCategoryOrder = ["property", "parking", "room", "bathroom", "other"];

const imageCategoryOrder: ImageCategoryKey[] = [
  ImageCategory.BUILDING_PHOTOS,
  ImageCategory.SHARED_FACILITIES_PHOTOS,
  ImageCategory.FLOOR_PLAN_PHOTOS,
  ImageCategory.ROOM_PHOTOS,
  ImageCategory.BATHROOM_PHOTOS,
  "OTHER",
];

const imageCategoryLabels: Record<ImageCategoryKey, string> = {
  [ImageCategory.BUILDING_PHOTOS]: "Foto Bangunan",
  [ImageCategory.SHARED_FACILITIES_PHOTOS]: "Fasilitas Bersama",
  [ImageCategory.FLOOR_PLAN_PHOTOS]: "Denah Lantai",
  [ImageCategory.ROOM_PHOTOS]: "Foto Kamar",
  [ImageCategory.BATHROOM_PHOTOS]: "Foto Kamar Mandi",
  OTHER: "Foto Lainnya",
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const magicCardClass =
  "overflow-hidden rounded-3xl border border-border/70 bg-card/95 text-foreground shadow-[0_25px_45px_-25px_rgba(15,23,42,0.35)] backdrop-blur transition-colors dark:border-border/40 dark:bg-card/70 dark:text-foreground dark:shadow-[0_25px_45px_-25px_rgba(15,23,42,0.65)]";

export function getPropertyTypeMeta(propertyType: PropertyType) {
  return propertyTypeMeta[propertyType];
}

export function groupFacilitiesByCategory(facilities: DetailFacility[]): Map<string, DetailFacility[]> {
  const groups = new Map<string, DetailFacility[]>();

  facilities.forEach((facility) => {
    if (!facility) return;
    const key = (facility.category ?? "other").toLowerCase();
    const bucket = groups.get(key) ?? [];
    bucket.push(facility);
    groups.set(key, bucket);
  });

  groups.forEach((items, key) => {
    items.sort((a, b) => a.name.localeCompare(b.name));
    groups.set(key, items);
  });

  return groups;
}

export function orderedFacilityEntries(map: Map<string, DetailFacility[]>) {
  const orderMap = new Map<string, number>();
  facilityCategoryOrder.forEach((category, index) => orderMap.set(category, index));

  return Array.from(map.entries()).sort((a, b) => {
    const orderA = orderMap.get(a[0]) ?? facilityCategoryOrder.length;
    const orderB = orderMap.get(b[0]) ?? facilityCategoryOrder.length;
    return orderA - orderB;
  });
}

export function resolveFacilityLabel(category: string) {
  return facilityCategoryLabels[category] ?? toTitleCase(category);
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function iconForFacilityCategory(category: string): ReactNode {
  switch (category) {
    case "parking":
      return <Car className="h-4 w-4 text-blue-500" />;
    case "room":
      return <BedDouble className="h-4 w-4 text-blue-500" />;
    case "bathroom":
      return <Bath className="h-4 w-4 text-blue-500" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
  }
}

export function formatCurrency(value?: number | null) {
  if (!value || value <= 0) return null;
  return currencyFormatter.format(value);
}

export function formatDeposit(room: PublicPropertyRoomDTO) {
  if (!room.depositRequired) {
    return "Tidak perlu deposit";
  }

  if (room.depositType === "PERCENTAGE") {
    return room.depositValue ? `Deposit ${room.depositValue}% dari harga sewa` : "Deposit persentase diperlukan";
  }

  if (room.depositType === "FIXED") {
    return room.depositValue ? `Deposit ${formatCurrency(room.depositValue)}` : "Deposit tetap diperlukan";
  }

  return "Deposit diperlukan";
}

export function getPricingEntries(room: PublicPropertyRoomDTO): PricingEntry[] {
  return [
    { label: "Bulanan", value: room.monthlyPrice, highlight: true },
    { label: "Harian", value: room.dailyPrice },
    { label: "Mingguan", value: room.weeklyPrice },
    { label: "Triwulan", value: room.quarterlyPrice },
    { label: "Tahunan", value: room.yearlyPrice },
  ].filter((entry) => entry.value && entry.value > 0);
}

export function groupImagesByCategory(images: PropertyImageDTO[]): Map<ImageCategoryKey, PropertyImageDTO[]> {
  const groups = new Map<ImageCategoryKey, PropertyImageDTO[]>();

  images.forEach((image) => {
    if (!image) return;
    const rawKey = image.category as ImageCategoryKey | undefined;
    const key = rawKey && imageCategoryOrder.includes(rawKey) ? rawKey : "OTHER";
    const bucket = groups.get(key) ?? [];
    bucket.push(image);
    groups.set(key, bucket);
  });

  groups.forEach((items, key) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    groups.set(key, items);
  });

  return groups;
}

export function orderedImageEntries(map: Map<ImageCategoryKey, PropertyImageDTO[]>) {
  const orderMap = new Map<ImageCategoryKey, number>();
  imageCategoryOrder.forEach((category, index) => orderMap.set(category, index));

  return Array.from(map.entries())
    .filter(([, images]) => images.length > 0)
    .sort((a, b) => {
      const orderA = orderMap.get(a[0]) ?? imageCategoryOrder.length;
      const orderB = orderMap.get(b[0]) ?? imageCategoryOrder.length;
      return orderA - orderB;
    });
}

export function getImageCategoryLabel(category: ImageCategoryKey) {
  return imageCategoryLabels[category];
}
