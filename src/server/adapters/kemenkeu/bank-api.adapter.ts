/**
 * Kemenkeu Bank API Adapter
 * Adapter for fetching bank list from Kemenkeu API
 * Tier 3: External Integration Adapter
 */

import type { BankFromAPI, BankListResponse } from "@/server/types/bank-account";
import type { Result } from "@/server/types/result";
import { ok, internalError } from "@/server/types/result";

const KEMENKEU_BANK_API_URL = "https://bios.kemenkeu.go.id/api/ws/ref/bank";

export class KemenkeuBankAdapter {
  /**
   * Fetch list of banks from Kemenkeu API
   */
  static async getBankList(): Promise<Result<BankFromAPI[]>> {
    try {
      const response = await fetch(KEMENKEU_BANK_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Cache for 24 hours since bank list doesn't change frequently
        next: { revalidate: 86400 },
      });

      if (!response.ok) {
        console.error("Failed to fetch bank list from Kemenkeu API:", response.statusText);
        return internalError("Gagal mengambil daftar bank dari server");
      }

      const responseData = await response.json();

      // Kemenkeu API returns: { status: 'MSG20001', message: 'Data ditemukan', data: [...] }
      let bankData: any[];

      if (responseData.data && Array.isArray(responseData.data)) {
        // Response is wrapped in { data: [...] }
        bankData = responseData.data;
      } else if (Array.isArray(responseData)) {
        // Response is direct array
        bankData = responseData;
      } else {
        console.error("Invalid response format from Kemenkeu API:", responseData);
        return internalError("Format data bank tidak valid");
      }

      // Map and validate each bank entry
      // API returns: { kode: '002', uraian: 'BANK BRI' }
      const banks: BankFromAPI[] = bankData
        .filter((item: any) => item.kode && item.uraian)
        .map((item: any) => ({
          kode: String(item.kode).trim(),
          nama: String(item.uraian).trim(),
        }))
        // Remove duplicates (some banks appear multiple times)
        .filter((bank, index, self) =>
          index === self.findIndex((b) => b.kode === bank.kode)
        )
        .sort((a, b) => a.nama.localeCompare(b.nama)); // Sort alphabetically

      return ok(banks);
    } catch (error) {
      console.error("Error fetching bank list from Kemenkeu API:", error);
      return internalError("Gagal mengambil daftar bank");
    }
  }

  /**
   * Get bank name by code
   */
  static async getBankName(bankCode: string): Promise<Result<string>> {
    const result = await this.getBankList();

    // fix: discriminated union Result type - guard before accessing error
    if (!result.success) {
      return internalError(result.error.message || "Gagal mengambil daftar bank");
    }

    const bank = result.data.find((b) => b.kode === bankCode);

    if (!bank) {
      return internalError("Bank tidak ditemukan");
    }

    return ok(bank.nama);
  }

  /**
   * Validate if bank code exists
   */
  static async validateBankCode(bankCode: string): Promise<Result<boolean>> {
    const result = await this.getBankList();

    // fix: discriminated union Result type - guard before accessing error
    if (!result.success) {
      return internalError(result.error.message || "Gagal mengambil daftar bank");
    }

    const exists = result.data.some((b) => b.kode === bankCode);
    return ok(exists);
  }
}

