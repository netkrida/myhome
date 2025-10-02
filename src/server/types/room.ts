/**
 * Room-related DTOs and types
 */

import { ImageCategory } from './property';

// Deposit Percentage Enum (must match Prisma enum values)
export enum DepositPercentage {
  TEN_PERCENT = "TEN_PERCENT",
  TWENTY_PERCENT = "TWENTY_PERCENT",
  THIRTY_PERCENT = "THIRTY_PERCENT",
  FORTY_PERCENT = "FORTY_PERCENT",
  FIFTY_PERCENT = "FIFTY_PERCENT",
}

// Room Facilities Types
export interface RoomFacility {
  id: string;
  name: string;
  category: 'room' | 'bathroom';
}

// Predefined Room Facilities
export const ROOM_FACILITIES: RoomFacility[] = [
  // Room Facilities
  { id: 'kasur', name: 'Kasur / Spring bed', category: 'room' },
  { id: 'bantal_guling', name: 'Bantal & guling', category: 'room' },
  { id: 'lemari_pakaian', name: 'Lemari pakaian', category: 'room' },
  { id: 'meja_belajar', name: 'Meja belajar & kursi', category: 'room' },
  { id: 'kursi_tambahan', name: 'Kursi tambahan / sofa kecil', category: 'room' },
  { id: 'ac_kipas', name: 'AC / Kipas angin', category: 'room' },
  { id: 'meja_rias', name: 'Meja rias / cermin', category: 'room' },
  { id: 'tv', name: 'TV', category: 'room' },
  { id: 'rak_buku', name: 'Rak buku', category: 'room' },
  { id: 'lampu_belajar', name: 'Lampu belajar', category: 'room' },
  { id: 'colokan_listrik', name: 'Colokan listrik tambahan', category: 'room' },
  { id: 'wifi', name: 'WiFi / Internet', category: 'room' },
  { id: 'jendela_tirai', name: 'Jendela dengan tirai', category: 'room' },
  { id: 'lantai_keramik', name: 'Lantai keramik / vinyl', category: 'room' },
  { id: 'tempat_sampah', name: 'Tempat sampah', category: 'room' },
  { id: 'ventilasi_udara', name: 'Ventilasi udara', category: 'room' },
  { id: 'dispenser', name: 'Dispenser / teko listrik', category: 'room' },
  { id: 'mini_kulkas', name: 'Mini kulkas', category: 'room' },

  // Bathroom Facilities
  { id: 'kamar_mandi_dalam_luar', name: 'Kamar mandi dalam / luar', category: 'bathroom' },
  { id: 'kloset', name: 'Kloset duduk / jongkok', category: 'bathroom' },
  { id: 'shower', name: 'Shower', category: 'bathroom' },
  { id: 'bak_mandi', name: 'Bak mandi', category: 'bathroom' },
  { id: 'wastafel', name: 'Wastafel', category: 'bathroom' },
  { id: 'cermin_km', name: 'Cermin', category: 'bathroom' },
  { id: 'air_panas', name: 'Air panas (water heater)', category: 'bathroom' },
  { id: 'tempat_sabun', name: 'Tempat sabun & shampoo', category: 'bathroom' },
  { id: 'gantungan_handuk', name: 'Gantungan handuk', category: 'bathroom' },
  { id: 'tempat_sampah_km', name: 'Tempat sampah kamar mandi', category: 'bathroom' },
  { id: 'exhaust_fan', name: 'Exhaust fan / ventilasi', category: 'bathroom' },
  { id: 'keran_air', name: 'Keran air bersih (sumur bor / PDAM)', category: 'bathroom' },
  { id: 'tisu_holder', name: 'Tisu / toilet paper holder', category: 'bathroom' },
  { id: 'lantai_anti_slip', name: 'Lantai keramik anti slip', category: 'bathroom' },
];

// Room Image Types
export interface RoomImageDTO {
  id: string;
  category: ImageCategory;
  imageUrl: string;
  publicId?: string;
  caption?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing Information
export interface RoomPricing {
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number; // 3 months
  yearlyPrice?: number;
  hasDeposit?: boolean;
  depositPercentage?: DepositPercentage;
}

// Base Room DTO
export interface RoomDTO {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  description?: string;
  size?: string;
  pricing: RoomPricing;
  hasDeposit: boolean;
  depositPercentage?: string;
  facilities: RoomFacility[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: RoomImageDTO[];
}

// Room Creation DTO (Step-by-step form)
export interface CreateRoomStep1DTO {
  roomTypePhotos: Record<string, {
    frontViewPhotos: string[];
    interiorPhotos: string[];
    bathroomPhotos: string[];
    description: string;
  }>;
}

export interface CreateRoomStep2DTO {
  facilities: RoomFacility[];
}

export interface CreateRoomStep3DTO {
  pricing: Record<string, RoomPricing>;
  hasAlternativeRentals: boolean;
  alternativeRentals?: {
    daily?: boolean;
    weekly?: boolean;
    quarterly?: boolean;
    yearly?: boolean;
  };
  hasDeposit: boolean;
  depositPercentage?: DepositPercentage;
}

export interface CreateRoomStep4DTO {
  rooms: RoomConfigurationItem[];
}

export interface RoomConfigurationItem {
  roomNumber: string;
  floor: number;
  roomType: string;
  isAvailable: boolean;
}

export interface CreateRoomDTO {
  propertyId: string;
  step1: CreateRoomStep1DTO;
  step2: CreateRoomStep2DTO;
  step3: CreateRoomStep3DTO;
  step4: CreateRoomStep4DTO;
}

// Room Update DTO
export interface UpdateRoomDTO {
  roomNumber?: string;
  floor?: number;
  roomType?: string;
  description?: string;
  size?: string;
  pricing?: Partial<RoomPricing>;
  facilities?: RoomFacility[];
  isAvailable?: boolean;
}

// Room List Query Parameters
export interface RoomListQuery {
  page?: number;
  limit?: number;
  search?: string;
  propertyId?: string;
  roomType?: string;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  floor?: number;
  sortBy?: 'roomNumber' | 'floor' | 'monthlyPrice' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Room List Response
export interface RoomListResponse {
  rooms: RoomListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Room List Item (for table/card display)
export interface RoomListItem {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  description?: string;
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  depositPercentage?: string;
  isAvailable: boolean;
  size?: string;
  facilities?: RoomFacility[];
  property: {
    id: string;
    name: string;
  };
  mainImage?: string;
  createdAt: Date;
}

// Room Detail Item (for detailed view)
export interface RoomDetailItem extends RoomDTO {
  property: {
    id: string;
    name: string;
    propertyType: string;
    location: {
      provinceName: string;
      regencyName: string;
      districtName: string;
      fullAddress: string;
    };
    owner: {
      id: string;
      name?: string;
      email?: string;
      phoneNumber?: string;
    };
  };
}

// Room Availability Update DTO
export interface UpdateRoomAvailabilityDTO {
  isAvailable: boolean;
}

// Room Statistics DTO
export interface RoomStatsDTO {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  averagePrice: number;
  roomTypeDistribution: {
    roomType: string;
    count: number;
    percentage: number;
  }[];
}

// Bulk Room Operations
export interface BulkUpdateRoomAvailabilityDTO {
  roomIds: string[];
  isAvailable: boolean;
}

export interface BulkUpdateRoomPricingDTO {
  roomIds: string[];
  pricing: Partial<RoomPricing>;
}

// Room Filter for Property Detail
export interface RoomFilterParams {
  roomType?: string;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  floor?: number;
}

// Public Room Detail DTO (for public room detail page)
export interface PublicRoomDetailDTO {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  description?: string;
  size?: string;
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  depositRequired: boolean;
  depositType?: 'PERCENTAGE' | 'FIXED';
  depositValue?: number;
  facilities: RoomFacility[];
  isAvailable: boolean;
  images: RoomImageDTO[];
  property: {
    id: string;
    name: string;
    propertyType: string;
    location: {
      provinceName: string;
      regencyName: string;
      districtName: string;
      fullAddress: string;
    };
    owner: {
      id: string;
      name?: string;
      email?: string;
      phoneNumber?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Public Property Rooms Query Parameters
export interface PublicPropertyRoomsQuery {
  page?: number;
  limit?: number;
  roomType?: string;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'monthlyPrice' | 'roomType';
  sortOrder?: 'asc' | 'desc';
}

// Public Property Rooms Response
export interface PublicPropertyRoomsResponse {
  rooms: PublicRoomCardDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Public Room Card DTO (for property rooms list)
export interface PublicRoomCardDTO {
  id: string;
  roomType: string;
  description?: string;
  size?: string;
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  depositRequired: boolean;
  depositType?: 'PERCENTAGE' | 'FIXED';
  depositValue?: number;
  facilities: RoomFacility[];
  isAvailable: boolean;
  mainImage?: string;
}

// Room Type Configuration
export interface RoomTypeConfig {
  name: string;
  description?: string;
  defaultFacilities: string[];
  suggestedPriceRange: {
    min: number;
    max: number;
  };
}

// Common Room Types
export const COMMON_ROOM_TYPES: RoomTypeConfig[] = [
  {
    name: 'Kamar Standard',
    description: 'Kamar dengan fasilitas dasar',
    defaultFacilities: ['kasur', 'lemari_pakaian', 'meja_belajar'],
    suggestedPriceRange: { min: 500000, max: 1000000 }
  },
  {
    name: 'Kamar AC',
    description: 'Kamar dengan AC dan fasilitas lengkap',
    defaultFacilities: ['kasur', 'lemari_pakaian', 'meja_belajar', 'ac_kipas'],
    suggestedPriceRange: { min: 800000, max: 1500000 }
  },
  {
    name: 'Kamar VIP',
    description: 'Kamar dengan fasilitas premium',
    defaultFacilities: ['kasur', 'lemari_pakaian', 'meja_belajar', 'ac_kipas', 'tv', 'mini_kulkas'],
    suggestedPriceRange: { min: 1200000, max: 2500000 }
  }
];

// Room availability info for individual room
export interface RoomAvailabilityInfo {
  id: string;
  roomNumber: string;
  floor: number;
  isAvailable: boolean;
  isOccupied: boolean;
  currentBooking?: {
    id: string;
    bookingCode: string;
    checkInDate: Date;
    checkOutDate?: Date;
    status: string;
    customerName: string;
  };
  mainImage?: string;
}

// Room type detail with availability breakdown
export interface RoomTypeDetailDTO {
  roomType: string;
  description?: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  pricing: {
    monthlyPrice: number;
    dailyPrice?: number;
    weeklyPrice?: number;
    quarterlyPrice?: number;
    yearlyPrice?: number;
  };
  depositInfo: {
    depositRequired: boolean;
    depositType?: 'PERCENTAGE' | 'FIXED';
    depositValue?: number;
  };
  facilities: RoomFacility[];
  rooms: RoomAvailabilityInfo[];
  mainImage?: string;
}

// Property basic info for room types response
export interface PropertyBasicInfo {
  id: string;
  name: string;
  propertyType: string;
  fullAddress: string;
  totalRooms: number;
  availableRooms: number;
}

// Main response for property room types API
export interface PropertyRoomTypesResponse {
  property: PropertyBasicInfo;
  roomTypes: RoomTypeDetailDTO[];
  summary: {
    totalRoomTypes: number;
    totalRooms: number;
    totalAvailable: number;
    totalOccupied: number;
  };
}

// Query parameters for property room types API
export interface PropertyRoomTypesQuery {
  includeOccupied?: boolean; // Include occupied rooms in response
  roomType?: string; // Filter by specific room type
}
