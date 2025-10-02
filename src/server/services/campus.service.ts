import { ok, fail, ErrorCode, type Result } from "../types/result";
import type { CampusApiResponse, CampusDTO, RawCampusItem } from "../types/campus";

/**
 * Domain service to retrieve campus data from external API.
 */
export class CampusService {
  private static readonly CAMPUS_API_URL = "https://api.ahmfarisi.com/perguruantinggi/";

  static async listCampuses(): Promise<Result<CampusDTO[]>> {
    try {
      const response = await fetch(this.CAMPUS_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 60 * 60 * 24, // revalidate every 24 hours
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch campuses:", response.status, response.statusText);
        return fail(
          {
            code: ErrorCode.EXTERNAL_SERVICE_ERROR,
            message: "Gagal mengambil data kampus",
            details: {
              status: response.status,
            },
          },
          502
        );
      }

      const payload = (await response.json()) as CampusApiResponse;
      const rawCampuses = Array.isArray(payload?.data) ? payload.data : null;

      if (payload?.success !== 1 || !rawCampuses) {
        console.error("Invalid campus response structure:", payload);
        return fail(
          {
            code: ErrorCode.EXTERNAL_SERVICE_ERROR,
            message: "Format data kampus tidak valid",
          },
          502
        );
      }

      const campuses: CampusDTO[] = rawCampuses
        .map((item: RawCampusItem, index: number) => {
          const candidateCode = item.kode ?? item.id;
          const code = candidateCode
            ? String(candidateCode)
            : typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
              ? globalThis.crypto.randomUUID()
              : `campus-${Date.now()}-${index}`;

          const name = item.nama ? String(item.nama).trim() : "";
          const citySource = item.kota ?? item.kabupaten ?? "";
          const city = citySource ? String(citySource).trim() : "";

          if (!name) {
            return null;
          }

          return {
            code,
            name,
            city,
          } satisfies CampusDTO;
        })
  .filter((campus): campus is CampusDTO => campus !== null)
  .sort((a, b) => a.name.localeCompare(b.name, "id"));

      return ok(campuses, 200);
    } catch (error) {
      console.error("Error fetching campuses:", error);
      return fail(
        {
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: "Terjadi kesalahan saat mengambil data kampus",
        },
        502
      );
    }
  }
}
