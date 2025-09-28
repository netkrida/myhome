import { ok, fail, ErrorCode } from "../types/result";
import type { Result } from "../types/result";

/**
 * Types for wilayah.id API responses
 */
export interface Province {
  code: string;
  name: string;
}

export interface Regency {
  code: string;
  name: string;
  province_code: string;
}

export interface District {
  code: string;
  name: string;
  regency_code: string;
}

/**
 * Domain service for Indonesian administrative regions
 * Tier 3: Domain logic for wilayah data
 */
export class WilayahService {
  private static readonly BASE_URL = "https://wilayah.id/api";

  /**
   * Get all provinces
   */
  static async getProvinces(): Promise<Result<Province[]>> {
    try {
      const response = await fetch(`${this.BASE_URL}/provinces.json`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache for 1 hour since this data doesn't change often
        cache: "force-cache",
      });

      if (!response.ok) {
        console.error("Failed to fetch provinces:", response.status, response.statusText);
        return fail({
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: "Gagal mengambil data provinsi",
        }, 500);
      }

      const responseData = await response.json();

      // wilayah.id returns data in { data: [...], meta: {...} } format
      const data = responseData.data;

      // Validate response structure
      if (!Array.isArray(data)) {
        console.error("Invalid provinces data structure:", responseData);
        return fail({
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: "Format data provinsi tidak valid",
        }, 500);
      }

      return ok(data.map((province: any) => ({
        code: province.code,
        name: province.name,
      })));
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return fail({
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: "Terjadi kesalahan saat mengambil data provinsi",
      }, 500);
    }
  }

  /**
   * Get regencies by province code
   */
  static async getRegencies(provinceCode: string): Promise<Result<Regency[]>> {
    try {
      if (!provinceCode) {
        return fail({
          code: ErrorCode.VALIDATION_ERROR,
          message: "Kode provinsi diperlukan",
        }, 400);
      }

      const response = await fetch(`${this.BASE_URL}/regencies/${provinceCode}.json`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "force-cache",
      });

      if (!response.ok) {
        console.error("Failed to fetch regencies:", response.status, response.statusText);
        return fail({
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: "Gagal mengambil data kabupaten/kota",
        }, 500);
      }

      const responseData = await response.json();
      const data = responseData.data;

      if (!Array.isArray(data)) {
        console.error("Invalid regencies data structure:", responseData);
        return fail({
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: "Format data kabupaten/kota tidak valid",
        }, 500);
      }

      return ok(data.map((regency: any) => ({
        code: regency.code,
        name: regency.name,
        province_code: regency.province_code,
      })));
    } catch (error) {
      console.error("Error fetching regencies:", error);
      return fail({
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: "Terjadi kesalahan saat mengambil data kabupaten/kota",
      }, 500);
    }
  }

  /**
   * Get districts by regency code
   */
  static async getDistricts(regencyCode: string): Promise<Result<District[]>> {
    try {
      if (!regencyCode) {
        return fail({
          code: ErrorCode.VALIDATION_ERROR,
          message: "Kode kabupaten/kota diperlukan",
        }, 400);
      }

      const response = await fetch(`${this.BASE_URL}/districts/${regencyCode}.json`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "force-cache",
      });

      if (!response.ok) {
        console.error("Failed to fetch districts:", response.status, response.statusText);
        return fail({
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: "Gagal mengambil data kecamatan",
        }, 500);
      }

      const responseData = await response.json();
      const data = responseData.data;

      if (!Array.isArray(data)) {
        console.error("Invalid districts data structure:", responseData);
        return fail({
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: "Format data kecamatan tidak valid",
        }, 500);
      }

      return ok(data.map((district: any) => ({
        code: district.code,
        name: district.name,
        regency_code: district.regency_code,
      })));
    } catch (error) {
      console.error("Error fetching districts:", error);
      return fail({
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: "Terjadi kesalahan saat mengambil data kecamatan",
      }, 500);
    }
  }

  /**
   * Get province by code
   */
  static async getProvinceByCode(code: string): Promise<Result<Province | null>> {
    try {
      const provincesResult = await this.getProvinces();
      
      if (!provincesResult.success) {
        return {
          success: false,
          error: provincesResult.error,
          statusCode: provincesResult.statusCode || 500
        };
      }

      const province = provincesResult.data?.find(p => p.code === code) || null;
      
      return {
        success: true,
        data: province || null,
        statusCode: 200
      };
    } catch (error) {
      console.error("Error getting province by code:", error);
      return {
        success: false,
        error: {
          message: "Terjadi kesalahan saat mengambil data provinsi",
          code: "WILAYAH_ERROR"
        },
        statusCode: 500
      };
    }
  }

  /**
   * Get regency by code
   */
  static async getRegencyByCode(provinceCode: string, regencyCode: string): Promise<Result<Regency | null>> {
    try {
      const regenciesResult = await this.getRegencies(provinceCode);
      
      if (!regenciesResult.success) {
        return {
          success: false,
          error: regenciesResult.error,
          statusCode: regenciesResult.statusCode || 500
        };
      }

      const regency = regenciesResult.data?.find(r => r.code === regencyCode) || null;
      
      return {
        success: true,
        data: regency || null,
        statusCode: 200
      };
    } catch (error) {
      console.error("Error getting regency by code:", error);
      return {
        success: false,
        error: {
          message: "Terjadi kesalahan saat mengambil data kabupaten/kota",
          code: "WILAYAH_ERROR"
        },
        statusCode: 500
      };
    }
  }

  /**
   * Get district by code
   */
  static async getDistrictByCode(regencyCode: string, districtCode: string): Promise<Result<District | null>> {
    try {
      const districtsResult = await this.getDistricts(regencyCode);
      
      if (!districtsResult.success) {
        return {
          success: false,
          error: districtsResult.error,
          statusCode: districtsResult.statusCode || 500
        };
      }

      const district = districtsResult.data?.find(d => d.code === districtCode) || null;

      return {
        success: true,
        data: district || null,
        statusCode: 200
      };
    } catch (error) {
      console.error("Error getting district by code:", error);
      return {
        success: false,
        error: {
          message: "Terjadi kesalahan saat mengambil data kecamatan",
          code: "WILAYAH_ERROR"
        },
        statusCode: 500
      };
    }
  }
}
