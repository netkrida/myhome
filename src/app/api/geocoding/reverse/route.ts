import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema untuk validasi input
const reverseGeocodingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  zoom: z.number().min(1).max(18).optional().default(10)
});

// Interface untuk response OpenStreetMap Nominatim
interface OSMReverseGeocodeResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city_block?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    city_district?: string;
    county?: string;
    state_district?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    "ISO3166-2-lvl4"?: string;
    "ISO3166-2-lvl3"?: string;
    [key: string]: string | undefined;
  };
  boundingbox: string[];
}

// Mapping nama provinsi dari OSM ke nama resmi Indonesia
const PROVINCE_MAPPING: Record<string, string> = {
  "Daerah Khusus Ibukota Jakarta": "DKI Jakarta",
  "Jakarta": "DKI Jakarta",
  "Special Capital Region of Jakarta": "DKI Jakarta",
  "West Java": "Jawa Barat",
  "Central Java": "Jawa Tengah",
  "East Java": "Jawa Timur",
  "Special Region of Yogyakarta": "DI Yogyakarta",
  "Yogyakarta": "DI Yogyakarta",
  "North Sumatra": "Sumatera Utara",
  "West Sumatra": "Sumatera Barat",
  "South Sumatra": "Sumatera Selatan",
  "East Kalimantan": "Kalimantan Timur",
  "South Kalimantan": "Kalimantan Selatan",
  "West Kalimantan": "Kalimantan Barat",
  "Central Kalimantan": "Kalimantan Tengah",
  "North Kalimantan": "Kalimantan Utara",
  "South Sulawesi": "Sulawesi Selatan",
  "North Sulawesi": "Sulawesi Utara",
  "Central Sulawesi": "Sulawesi Tengah",
  "Southeast Sulawesi": "Sulawesi Tenggara",
  "West Sulawesi": "Sulawesi Barat",
  "Riau Islands": "Kepulauan Riau",
  "Bangka Belitung Islands": "Bangka Belitung",
  "West Nusa Tenggara": "Nusa Tenggara Barat",
  "East Nusa Tenggara": "Nusa Tenggara Timur",
  "North Maluku": "Maluku Utara",
  "West Papua": "Papua Barat",
  "Southwest Papua": "Papua Barat Daya",
  "Central Papua": "Papua Tengah",
  "Highland Papua": "Papua Pegunungan",
  "South Papua": "Papua Selatan"
};

// Fungsi untuk mapping hasil OSM Nominatif ke format Indonesia
function mapOSMToIndonesianLocation(osmData: OSMReverseGeocodeResponse) {
  const address = osmData.address;
  
  console.log("🗺️ Raw OSM address data:", address);
  
  // Deteksi Jakarta khusus
  const isJakarta = address.city?.includes("Jakarta") || 
                   address.county?.includes("Jakarta") || 
                   address.state?.includes("Jakarta") ||
                   address["ISO3166-2-lvl4"] === "ID-JK";
  
  let provinceName: string;
  let regencyName: string;
  let districtName: string;
  
  if (isJakarta) {
    // Untuk Jakarta, provinsi selalu DKI Jakarta
    provinceName = "DKI Jakarta";
    // Regency adalah kota administratif (Jakarta Selatan, Jakarta Pusat, dll)
    regencyName = address.city || address.county || "Jakarta Pusat";
    // District adalah kecamatan
    districtName = address.city_district || address.district || address.suburb || "Unknown District";
  } else {
    // Untuk daerah lain, gunakan mapping normal
    const rawProvinceName = address.state || address.region || "Unknown Province";
    provinceName = PROVINCE_MAPPING[rawProvinceName] || rawProvinceName;
    
    // Kabupaten/Kota: biasanya di 'county' untuk kabupaten, 'city' untuk kota
    regencyName = address.county || address.city || address.town || "Unknown Regency";
    
    // Kecamatan: biasanya di 'city_district', fallback ke 'district' atau 'suburb'
    districtName = address.city_district || address.district || address.suburb || "Unknown District";
  }
  
  // Kelurahan/Desa: biasanya di 'neighbourhood', 'village', atau 'city_block'
  const villageName = address.neighbourhood || address.village || address.city_block || "";
  
  // Ekstrak komponen alamat untuk fullAddress
  const addressComponents = [
    address.house_number,
    address.road,
    villageName,
    districtName !== "Unknown District" ? districtName : null,
    regencyName !== "Unknown Regency" ? regencyName : null,
    provinceName !== "Unknown Province" ? provinceName : null,
    address.postcode
  ].filter(Boolean);
  
  const fullAddress = addressComponents.length > 0 
    ? addressComponents.join(", ") 
    : osmData.display_name;
  
  console.log("🗺️ Mapped Indonesian location:", {
    isJakarta,
    provinceName,
    regencyName,
    districtName,
    fullAddress
  });
  
  return {
    provinceName,
    regencyName, 
    districtName,
    fullAddress,
    latitude: parseFloat(osmData.lat),
    longitude: parseFloat(osmData.lon),
    // Kode-kode ini akan kosong karena OSM tidak menyediakan kode administratif Indonesia
    provinceCode: undefined,
    regencyCode: undefined,
    districtCode: undefined,
    // Data tambahan dari OSM
    osmData: {
      displayName: osmData.display_name,
      addressType: osmData.addresstype,
      placeRank: osmData.place_rank,
      importance: osmData.importance,
      boundingBox: osmData.boundingbox,
      rawAddress: address // Simpan data mentah untuk debugging
    }
  };
}

/**
 * GET /api/geocoding/reverse
 * Reverse geocoding menggunakan OpenStreetMap Nominatim API
 * Query params: lat, lon, zoom (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse dan validasi query parameters
    const queryParams = {
      lat: parseFloat(searchParams.get("lat") || "0"),
      lon: parseFloat(searchParams.get("lon") || "0"),
      zoom: parseInt(searchParams.get("zoom") || "10")
    };

    console.log("🌍 Reverse geocoding request:", queryParams);

    // Validasi input
    const validationResult = reverseGeocodingSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { lat, lon, zoom } = validationResult.data;

    // URL Nominatim API dengan format yang tepat
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    nominatimUrl.searchParams.set("format", "jsonv2");
    nominatimUrl.searchParams.set("lat", lat.toString());
    nominatimUrl.searchParams.set("lon", lon.toString());
    nominatimUrl.searchParams.set("zoom", zoom.toString());
    nominatimUrl.searchParams.set("addressdetails", "1");
    nominatimUrl.searchParams.set("accept-language", "id");
    nominatimUrl.searchParams.set("countrycodes", "id"); // Batasi ke Indonesia

    console.log("🌍 Calling Nominatim API:", nominatimUrl.toString());

    // Panggil API Nominatim
    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "MyHomeApp/1.0 (property-management-app)", // Required by Nominatim
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      console.error("🌍 Nominatim API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch location data from OpenStreetMap" },
        { status: 502 }
      );
    }

    const osmData: OSMReverseGeocodeResponse = await response.json();
    console.log("🌍 Nominatim response:", JSON.stringify(osmData, null, 2));

    // Periksa apakah data ditemukan
    if (!osmData || !osmData.address) {
      return NextResponse.json(
        { error: "No location data found for the given coordinates" },
        { status: 404 }
      );
    }

    // Map data OSM ke format yang diharapkan aplikasi
    const locationData = mapOSMToIndonesianLocation(osmData);
    
    console.log("🌍 Mapped location data:", JSON.stringify(locationData, null, 2));

    return NextResponse.json({
      success: true,
      data: locationData
    });

  } catch (error) {
    console.error("🌍 Reverse geocoding error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error during reverse geocoding",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geocoding/reverse
 * Reverse geocoding with multiple coordinates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Schema untuk multiple coordinates
    const multipleReverseSchema = z.object({
      coordinates: z.array(z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        id: z.string().optional() // Optional ID untuk tracking
      })).min(1).max(10), // Maksimal 10 koordinat sekaligus
      zoom: z.number().min(1).max(18).optional().default(10)
    });

    const validationResult = multipleReverseSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { coordinates, zoom } = validationResult.data;
    
    console.log("🌍 Multiple reverse geocoding request:", { coordinates, zoom });

    // Process semua koordinat
    const results = await Promise.allSettled(
      coordinates.map(async (coord) => {
        const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        nominatimUrl.searchParams.set("format", "jsonv2");
        nominatimUrl.searchParams.set("lat", coord.lat.toString());
        nominatimUrl.searchParams.set("lon", coord.lon.toString());
        nominatimUrl.searchParams.set("zoom", zoom.toString());
        nominatimUrl.searchParams.set("addressdetails", "1");
        nominatimUrl.searchParams.set("accept-language", "id");
        nominatimUrl.searchParams.set("countrycodes", "id");

        const response = await fetch(nominatimUrl.toString(), {
          headers: {
            "User-Agent": "MyHomeApp/1.0 (property-management-app)",
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }

        const osmData: OSMReverseGeocodeResponse = await response.json();
        
        if (!osmData || !osmData.address) {
          throw new Error("No location data found");
        }

        return {
          id: coord.id,
          input: coord,
          location: mapOSMToIndonesianLocation(osmData)
        };
      })
    );

    // Separate successful and failed results
    const successful: any[] = [];
    const failed: any[] = [];

    results.forEach((result, index) => {
      const coord = coordinates[index];
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          id: coord?.id,
          input: coord,
          error: result.reason?.message || "Unknown error"
        });
      }
    });

    console.log("🌍 Multiple reverse geocoding results:", { successful: successful.length, failed: failed.length });

    return NextResponse.json({
      success: true,
      data: {
        successful,
        failed,
        summary: {
          total: coordinates.length,
          successful: successful.length,
          failed: failed.length
        }
      }
    });

  } catch (error) {
    console.error("🌍 Multiple reverse geocoding error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error during multiple reverse geocoding",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
