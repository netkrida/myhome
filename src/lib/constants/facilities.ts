/**
 * Predefined facilities and rules for kos properties and rooms
 * Based on the requirements and existing data structure
 */

// Property facilities - general building and common area facilities
export const PROPERTY_FACILITIES = [
  // Basic amenities
  "WiFi Fiber 100 Mbps",
  "WiFi",
  "Security 24 jam",
  "CCTV",
  "Cleaning service",
  "Laundry service",

  // Kitchen and dining
  "Dapur modern",
  "Dapur bersama",
  "Kulkas bersama",
  "Dispenser air",
  "Microwave",

  // Common areas
  "Ruang tamu",
  "Co-working space",
  "Rooftop garden",
  "Teras",
  "Balkon",
  "Ruang jemur",

  // Location advantages
  "Dekat MRT",
  "Dekat stasiun",
  "Dekat kampus",
  "Dekat mall",
  "Dekat rumah sakit",
  "Dekat minimarket",
  "Akses mudah transportasi umum",

  // Additional services
  "Resepsionis",
  "Penjaga kos",
  "Layanan antar jemput",
  "Paket internet unlimited",
] as const;

// Room facilities - specific to individual rooms
export const ROOM_FACILITIES = [
  // Basic room amenities
  "AC",
  "Kipas angin",
  "Tempat tidur",
  "Kasur",
  "Bantal",
  "Guling",
  "Sprei",
  "Selimut",

  // Furniture
  "Lemari pakaian",
  "Meja belajar",
  "Kursi",
  "Rak buku",
  "Cermin",
  "Gantungan baju",

  // Electronics
  "TV",
  "Kulkas mini",
  "Dispenser",
  "Stop kontak",
  "Lampu baca",

  // Additional amenities
  "Balkon pribadi",
  "Jendela besar",
  "Ventilasi udara",
  "Kunci pintu",
  "WiFi dalam kamar",
] as const;

// Bathroom facilities - specific to bathrooms
export const BATHROOM_FACILITIES = [
  "Kamar mandi dalam",
  "Kamar mandi luar",
  "Water heater",
  "Shower",
  "Kloset duduk",
  "Kloset jongkok",
  "Wastafel",
  "Cermin",
  "Gantungan handuk",
  "Rak sabun",
  "Ventilasi udara",
  "Lampu",
  "Keramik anti slip",
] as const;

// Parking facilities - specific to parking areas
export const PARKING_FACILITIES = [
  "Parkir motor",
  "Parkir mobil",
  "Parkir motor & mobil",
  "Parkir tertutup",
  "Parkir terbuka",
  "Security parkir",
  "CCTV parkir",
  "Akses 24 jam",
  "Parkir gratis",
  "Parkir berbayar",
] as const;

// Predefined kos rules based on requirements
export const PREDEFINED_RULES = [
  "> 5 orang/kamar",
  "Ada jam malam",
  "Ada jam malam untuk tamu",
  "Akses 24 Jam",
  "Bawa hasil tes antigen saat check-in (sewa harian)",
  "Boleh bawa anak",
  "Boleh bawa hewan",
  "Boleh pasutri",
  "Check-in pukul 14:00-21:00 (sewa harian)",
  "Check-out maks. pukul 12:00 (sewa harian)",
  "Denda kerusakan barang kos",
  "Dilarang bawa hewan",
  "Dilarang menerima tamu",
  "Dilarang merokok di kamar",
  "Harga termasuk listrik (sewa harian)",
  "Kamar hanya bagi penyewa",
  "Khusus Mahasiswa",
  "Khusus karyawan",
  "Kriteria umum",
  "Lawan jenis dilarang ke kamar",
  "Maks. 1 orang/kamar",
  "Maks. 2 orang/kamar",
  "Maks. 3 orang/kamar",
  "Maks. 4 orang/kamar",
  "Maksimal 2 orang (sewa harian)",
  "Menunjukan bukti (-) Swab saat check-in",
  "Pasutri wajib membawa surat nikah (sewa harian)",
  "Tambah biaya untuk alat elektronik",
  "Tamu bebas berkunjung",
  "Tamu boleh menginap",
  "Tamu dilarang menginap",
  "Tamu menginap dikenakan biaya",
  "Tanpa deposit (sewa harian)",
  "Termasuk listrik",
  "Tidak bisa DP (sewa harian)",
  "Tidak boleh bawa anak",
  "Tidak untuk pasutri",
  "Wajib ikut piket",
  "Wajib lampirkan KTP saat check-in (sewa harian)",
  "Wajib sertakan KTP saat pengajuan sewa",
  "Wajib sertakan buku nikah saat pengajuan sewa",
  "Wajib sertakan kartu keluarga saat pengajuan sewa",
] as const;

// Property types with display labels
export const PROPERTY_TYPES = [
  { value: "KOS_PUTRA", label: "Kos Putra", description: "Male only" },
  { value: "KOS_PUTRI", label: "Kos Putri", description: "Female only" },
  { value: "KOS_CAMPUR", label: "Kos Campur", description: "Mixed gender" },
] as const;

// Image categories with display information
export const IMAGE_CATEGORIES = {
  BUILDING_PHOTOS: {
    label: "Building Photos",
    subcategories: [
      { key: "front_building", label: "Foto tampak bangunan depan" },
      { key: "interior_building", label: "Foto tampilan dalam bangunan" },
      { key: "street_view", label: "Foto tampak jalan" },
    ],
  },
  SHARED_FACILITIES_PHOTOS: {
    label: "Shared Facilities Photos",
    subcategories: [],
  },
  ROOM_PHOTOS: {
    label: "Room Photos", 
    subcategories: [
      { key: "front_room", label: "Foto depan kamar" },
      { key: "interior_room", label: "Foto dalam kamar" },
    ],
  },
  BATHROOM_PHOTOS: {
    label: "Bathroom Photos",
    subcategories: [],
  },
} as const;

// Export types for TypeScript
export type PropertyFacility = typeof PROPERTY_FACILITIES[number];
export type RoomFacility = typeof ROOM_FACILITIES[number];
export type BathroomFacility = typeof BATHROOM_FACILITIES[number];
export type ParkingFacility = typeof PARKING_FACILITIES[number];
export type PredefinedRule = typeof PREDEFINED_RULES[number];
export type PropertyType = typeof PROPERTY_TYPES[number]["value"];
