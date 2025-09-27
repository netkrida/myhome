/**
 * Room-related DTOs and types
 */

import { ImageCategory } from './property';

// Deposit Percentage Enum
export enum DepositPercentage {
  TEN_PERCENT = "10_PERCENT",
  TWENTY_PERCENT = "20_PERCENT",
  THIRTY_PERCENT = "30_PERCENT",
  FORTY_PERCENT = "40_PERCENT",
  FIFTY_PERCENT = "50_PERCENT",
}

// Room Facilities Types
export interface RoomFacility {
  id: string;
  name: string;
  category: 'room' | 'bathroom';
}

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
  hasDeposit: boolean;
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
  facilities: RoomFacility[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: RoomImageDTO[];
}

// Room Creation DTO (Step-by-step form)
export interface CreateRoomStep1DTO {
  roomType: string;
  images: {
    roomPhotos: any[];
    bathroomPhotos?: any[];
  };
  description?: string;
}

export interface CreateRoomStep2DTO {
  facilities: RoomFacility[];
}

export interface CreateRoomStep3DTO {
  pricing: RoomPricing;
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
  monthlyPrice: number;
  isAvailable: boolean;
  size?: string;
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

// Predefined Room Facilities
export const ROOM_FACILITIES = {
  room: [
    { id: 'kasur', name: 'Kasur / Spring bed' },
    { id: 'bantal_guling', name: 'Bantal & guling' },
    { id: 'lemari_pakaian', name: 'Lemari pakaian' },
    { id: 'meja_belajar', name: 'Meja belajar & kursi' },
    { id: 'kursi_tambahan', name: 'Kursi tambahan / sofa kecil' },
    { id: 'ac_kipas', name: 'AC / Kipas angin' },
    { id: 'meja_rias', name: 'Meja rias / cermin' },
    { id: 'tv', name: 'TV' },
    { id: 'rak_buku', name: 'Rak buku' },
    { id: 'lampu_belajar', name: 'Lampu belajar' },
    { id: 'colokan_listrik', name: 'Colokan listrik tambahan' },
    { id: 'wifi', name: 'WiFi / Internet' },
    { id: 'jendela_tirai', name: 'Jendela dengan tirai' },
    { id: 'lantai_keramik', name: 'Lantai keramik / vinyl' },
    { id: 'tempat_sampah', name: 'Tempat sampah' },
    { id: 'ventilasi', name: 'Ventilasi udara' },
    { id: 'dispenser', name: 'Dispenser / teko listrik' },
    { id: 'mini_kulkas', name: 'Mini kulkas' }
  ],
  bathroom: [
    { id: 'kamar_mandi_dalam', name: 'Kamar mandi dalam / luar' },
    { id: 'kloset_duduk', name: 'Kloset duduk / jongkok' },
    { id: 'shower', name: 'Shower' },
    { id: 'bak_mandi', name: 'Bak mandi' },
    { id: 'wastafel', name: 'Wastafel' },
    { id: 'cermin', name: 'Cermin' },
    { id: 'air_panas', name: 'Air panas (water heater)' },
    { id: 'tempat_sabun', name: 'Tempat sabun & shampoo' },
    { id: 'gantungan_handuk', name: 'Gantungan handuk' },
    { id: 'tempat_sampah_km', name: 'Tempat sampah kamar mandi' },
    { id: 'exhaust_fan', name: 'Exhaust fan / ventilasi' },
    { id: 'keran_air', name: 'Keran air bersih (sumur bor / PDAM)' },
    { id: 'tisu_holder', name: 'Tisu / toilet paper holder' },
    { id: 'lantai_anti_slip', name: 'Lantai keramik anti slip' }
  ]
} as const;

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
