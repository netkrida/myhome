import { CampusService } from "../services/campus.service";
import { fail, ErrorCode, type Result } from "../types/result";
import type { CampusDTO } from "../types/campus";

export class CampusAPI {
  static async listCampuses(): Promise<Result<CampusDTO[]>> {
    try {
      return await CampusService.listCampuses();
    } catch (error) {
      console.error("Error in Campus API:", error);
      return fail(
        {
          code: ErrorCode.INTERNAL_ERROR,
          message: "Terjadi kesalahan saat memproses data kampus",
        },
        500
      );
    }
  }
}
