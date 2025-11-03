import type { PaginationDTO } from "./user";
/**
 * Property-related DTOs and types
 */

// Enums from Prisma
export enum PropertyType {
  MALE_ONLY = 'MALE_ONLY',
  FEMALE_ONLY = 'FEMALE_ONLY',
  MIXED = 'MIXED'
}

export enum PropertyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum ImageCategory {
  BUILDING_PHOTOS = 'BUILDING_PHOTOS',
  SHARED_FACILITIES_PHOTOS = 'SHARED_FACILITIES_PHOTOS',
  FLOOR_PLAN_PHOTOS = 'FLOOR_PLAN_PHOTOS',
  ROOM_PHOTOS = 'ROOM_PHOTOS',
  BATHROOM_PHOTOS = 'BATHROOM_PHOTOS'
}

// Property Facilities and Rules Types
export interface PropertyFacility {
  id: string;
  name: string;
  category: 'property' | 'parking';
}

export interface PropertyRule {
  id: string;
  name: string;
  description?: string;
}

// Location Types
export interface LocationData {
  provinceCode?: string;
  provinceName: string;
  regencyCode?: string;
  regencyName: string;
  districtCode?: string;
  districtName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

// Property Image Types
export interface PropertyImageDTO {
  id: string;
  category: ImageCategory;
  imageUrl: string;
  publicId?: string;
  caption?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Base Property DTO
export interface PropertyDTO {
  id: string;
  name: string;
  buildYear: number;
  propertyType: PropertyType;
  description: string;
  roomTypes: string[];
  totalRooms: number;
  availableRooms: number;
  location: LocationData;
  facilities: PropertyFacility[];
  rules: PropertyRule[];
  status: PropertyStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  images: PropertyImageDTO[];
}

// Property Creation DTO (Step-by-step form)
export interface CreatePropertyStep1DTO {
  name: string;
  buildYear: number;
  propertyType: PropertyType;
  roomTypes: string[];
  totalRooms: number;
  availableRooms: number;
  description: string;
}

export interface CreatePropertyStep2DTO {
  location: LocationData;
}

export interface CreatePropertyStep3DTO {
  images: {
    buildingPhotos: any[];
    sharedFacilitiesPhotos?: any[];
    floorPlanPhotos?: any[];
  };
}

export interface CreatePropertyStep4DTO {
  facilities: PropertyFacility[];
  rules: PropertyRule[];
}

export interface CreatePropertyDTO {
  step1: CreatePropertyStep1DTO;
  step2: CreatePropertyStep2DTO;
  step3?: CreatePropertyStep3DTO;
  step4: CreatePropertyStep4DTO;
}

// Property Update DTO
export interface UpdatePropertyDTO {
  name?: string;
  buildYear?: number;
  propertyType?: PropertyType;
  description?: string;
  roomTypes?: string[];
  totalRooms?: number;
  location?: Partial<LocationData>;
  facilities?: PropertyFacility[];
  rules?: PropertyRule[];
}

// Property List Query Parameters
export interface PropertyListQuery {
  page?: number;
  limit?: number;
  search?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  ownerId?: string;
  provinceCode?: string;
  regencyCode?: string;
  districtCode?: string;
  sortBy?: 'name' | 'createdAt' | 'buildYear' | 'totalRooms';
  sortOrder?: 'asc' | 'desc';
}

// Property List Response
export interface PropertyListResponse {
  properties: PropertyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Property List Item (for table/card display)
export interface PropertyListItem {
  id: string;
  name: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  totalRooms: number;
  availableRooms: number;
  location: {
    provinceName: string;
    regencyName: string;
    districtName: string;
  };
  owner: {
    id: string;
    name?: string;
    email?: string;
  };
  facilities: PropertyFacility[];
  createdAt: Date;
  mainImage?: string;
}

// Property Detail Item (for detailed view)
export interface PropertyDetailItem extends PropertyDTO {
  owner: {
    id: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
  approver?: {
    id: string;
    name?: string;
    email?: string;
  };
  rooms: RoomSummary[];
}

// Property Approval DTO
export interface PropertyApprovalDTO {
  status: PropertyStatus;
  rejectionReason?: string;
}

// Property Statistics DTO
export interface PropertyStatsDTO {
  totalProperties: number;
  pendingProperties: number;
  approvedProperties: number;
  rejectedProperties: number;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
}

// Property Coordinate DTO (for map display)
export interface PropertyCoordinate {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  propertyType: PropertyType;
  location: {
    districtName: string;
    regencyName: string;
    provinceName: string;
  };
  totalRooms: number;
  availableRooms: number;
  mainImage?: string;
}

// Public Property Statistics DTO (for public pages)
export interface PublicPropertyStats {
  totalProperties: number;
  totalRooms: number;
  availableRooms: number;
  averageOccupancyRate: number;
  propertiesByType: {
    maleOnly: number;
    femaleOnly: number;
    mixed: number;
  };
}

// Room Image DTO for Room summary
export interface RoomImageSummary {
  id: string;
  category: ImageCategory;
  imageUrl: string;
  publicId?: string;
  caption?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Supporting types for Room summary in Property
export interface RoomSummary {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  description?: string;
  size?: string;
  monthlyPrice: number;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  quarterlyPrice?: number | null;
  yearlyPrice?: number | null;
  hasDeposit: boolean;
  depositPercentage?: string | null;
  facilities: any[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: RoomImageSummary[];
}

// Predefined Facilities and Rules
export const PROPERTY_FACILITIES = {
  property: [
    { id: 'kasur', name: 'Kasur / Spring bed' },
    { id: 'lemari', name: 'Lemari pakaian' },
    { id: 'meja_belajar', name: 'Meja belajar & kursi' },
    { id: 'kamar_mandi', name: 'Kamar mandi dalam / luar' },
    { id: 'ac_kipas', name: 'AC / Kipas angin' },
    { id: 'wifi', name: 'WiFi / Internet' },
    { id: 'dapur_bersama', name: 'Dapur bersama' },
    { id: 'laundry', name: 'Laundry (mesin cuci bersama / jasa laundry)' },
    { id: 'ruang_tamu', name: 'Ruang tamu / ruang santai' },
    { id: 'area_jemur', name: 'Area jemur pakaian' },
    { id: 'air_bersih', name: 'Air bersih (sumur bor / PDAM)' },
    { id: 'listrik', name: 'Listrik sudah termasuk / token sendiri' },
    { id: 'cctv_keamanan', name: 'CCTV & keamanan 24 jam' }
  ],
  parking: [
    { id: 'parkir_motor', name: 'Parkir motor' },
    { id: 'parkir_mobil', name: 'Parkir mobil' },
    { id: 'parkir_sepeda', name: 'Parkir sepeda' },
    { id: 'parkir_bersama', name: 'Parkir bersama (terbuka, tanpa sekat)' },
    { id: 'parkir_tertutup', name: 'Parkir tertutup / indoor (ada atap)' },
    { id: 'parkir_terbatas', name: 'Parkir terbatas (hanya motor atau hanya untuk penghuni tertentu)' },
    { id: 'parkir_luas', name: 'Parkir luas (bisa untuk tamu juga)' },
    { id: 'parkir_kartu', name: 'Akses parkir dengan kartu/kunci (gate/portal)' },
    { id: 'parkir_cctv', name: 'Parkir dengan CCTV atau satpam' }
  ]
} as const;

export const PROPERTY_RULES = [
  { id: 'jam_malam', name: 'Jam malam (misalnya maksimal jam 11 malam)' },
  { id: 'tamu_dilarang_menginap', name: 'Tamu dilarang menginap' },
  { id: 'tamu_lawan_jenis_dilarang', name: 'Tamu lawan jenis dilarang masuk kamar' },
  { id: 'tamu_ruang_tamu_saja', name: 'Tamu hanya boleh di ruang tamu / area bersama' },
  { id: 'dilarang_hewan', name: 'Dilarang membawa hewan peliharaan' },
  { id: 'dilarang_merokok_kamar', name: 'Dilarang merokok di dalam kamar' },
  { id: 'dilarang_merokok_bersama', name: 'Dilarang merokok di area bersama' },
  { id: 'jaga_kebersihan', name: 'Menjaga kebersihan kamar dan area bersama' },
  { id: 'tidak_merusak_fasilitas', name: 'Tidak boleh merusak fasilitas kos' },
  { id: 'bayar_tepat_waktu', name: 'Wajib bayar kos tepat waktu' },
  { id: 'tidak_bising', name: 'Tidak boleh bising/berisik setelah jam tertentu' },
  { id: 'parkir_sesuai_area', name: 'Parkir sesuai area yang ditentukan' },
  { id: 'dilarang_alkohol_narkoba', name: 'Dilarang membawa atau mengonsumsi alkohol/narkoba' },
  { id: 'izin_perbaikan', name: 'Harus izin jika ada perbaikan atau renovasi kamar' },
  { id: 'hemat_energi', name: 'Lampu, listrik, dan air dipakai seperlunya (hemat energi)' },
  { id: 'dilarang_alat_listrik_besar', name: 'Penggunaan alat listrik berdaya tinggi (rice cooker, setrika, dispenser, dll) di kamar dilarang' },
  { id: 'dilarang_memasak_kamar', name: 'Dilarang memasak di dalam kamar' },
  { id: 'barang_hilang_bukan_tanggung_jawab', name: 'Barang pribadi yang hilang bukan tanggung jawab pemilik kos' },
  { id: 'tidak_memindahkan_fasilitas', name: 'Tidak boleh memindahkan atau memodifikasi fasilitas kos tanpa izin' },
  { id: 'konfirmasi_pindah', name: 'Jika pindah, wajib konfirmasi minimal H-30 hari' },
  { id: 'dilarang_senjata_tajam', name: 'Dilarang memelihara senjata tajam atau barang berbahaya' },
  { id: 'aturan_sampah', name: 'Patuhi aturan kebersihan sampah (buang di tempat yang ditentukan)' },
  { id: 'kendaraan_dikunci', name: 'Kendaraan wajib dikunci sendiri, keamanan pribadi ditanggung penyewa' },
  { id: 'dilarang_aktivitas_ilegal', name: 'Dilarang menyimpan atau melakukan aktivitas ilegal di dalam kos' },
  { id: 'tidak_perayaan_tanpa_izin', name: 'Tidak boleh melakukan perayaan/acara tanpa izin pemilik kos' },
  { id: 'dilarang_sound_system', name: 'Dilarang menggunakan sound system besar atau alat musik keras tanpa izin' }
] as const;

// Common Room Types for Properties
export const PROPERTY_ROOM_TYPES = [
  'Kamar Standard',
  'Kamar AC',
  'Kamar VIP',
  'Kamar Suite',
  'Kamar Single',
  'Kamar Double',
  'Kamar Shared',
  'Kamar Studio',
  'Kamar Deluxe',
  'Kamar Executive'
] as const;

// Parking Facilities (extracted from PROPERTY_FACILITIES.parking)
export const PARKING_FACILITIES = PROPERTY_FACILITIES.parking;

// Public Property Card DTO (for homepage)
export interface PublicPropertyCardDTO {
  id: string;
  name: string;
  propertyType: PropertyType;
  availableRooms: number;
  facilities: PropertyFacility[];
  cheapestMonthlyPrice: number;
  mainImage?: string;
  location: {
    districtName: string;
    regencyName: string;
  };
}

// Public Properties Query Parameters
export interface PublicPropertiesQuery {
  page?: number;
  limit?: number;
  propertyType?: PropertyType;
  provinceName?: string;
  regencyName?: string;
  districtName?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

// Public Properties Response
export interface PublicPropertiesResponse {
  properties: PublicPropertyCardDTO[];
  pagination: PaginationDTO;
}

// Public Room Detail DTO within property detail context
export interface PublicPropertyRoomDTO {
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
  facilities: any[]; // Room facilities as JSON
  isAvailable: boolean;
  images: PropertyImageDTO[]; // Reuse PropertyImageDTO for room images
}

// Public Property Detail DTO (for property detail page)
export interface PublicPropertyDetailDTO {
  id: string;
  name: string;
  buildYear: number;
  propertyType: PropertyType;
  description: string;
  roomTypes: string[];
  totalRooms: number;
  availableRooms: number;
  location: {
    provinceCode: string;
    provinceName: string;
    regencyCode: string;
    regencyName: string;
    districtCode: string;
    districtName: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
  };
  facilities: PropertyFacility[];
  rules: PropertyRule[];
  images: PropertyImageDTO[];
  rooms: PublicPropertyRoomDTO[];
  createdAt: Date;
  updatedAt: Date;
}
