import bcrypt from "bcryptjs";
import { db } from "../db";
import type { 
  AdminKosRegistrationData, 
  AdminKosRegistrationResult 
} from "../types/adminkos";
import { ok, fail, conflict, internalError, ErrorCode } from "../types/result";
import type { Result } from "../types/result";

/**
 * Domain service for AdminKos registration
 * Tier 3: Domain logic for AdminKos registration
 */
export class AdminKosRegistrationService {
  /**
   * Register a new AdminKos user
   */
  static async registerAdminKos(
    data: AdminKosRegistrationData
  ): Promise<Result<AdminKosRegistrationResult>> {
    try {
      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return conflict("Email sudah terdaftar");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user and profile in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create user with ADMINKOS role
        const user = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            password: hashedPassword,
            provinceCode: data.provinceCode,
            provinceName: data.provinceName,
            regencyCode: data.regencyCode,
            regencyName: data.regencyName,
            districtCode: data.districtCode,
            districtName: data.districtName,
            streetAddress: data.streetAddress,
            role: "ADMINKOS",
            isActive: true,
          },
        });

        // Create AdminKos profile
        const profile = await tx.adminKosProfile.create({
          data: {
            userId: user.id,
          },
        });

        return { user, profile };
      });

      return ok(result, 201);
    } catch (error) {
      console.error("Error registering AdminKos:", error);
      return internalError("Terjadi kesalahan saat mendaftarkan akun");
    }
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string): Promise<Result<boolean>> {
    try {
      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      return ok(!existingUser);
    } catch (error) {
      console.error("Error checking email availability:", error);
      return internalError("Terjadi kesalahan saat memeriksa email");
    }
  }

  /**
   * Get AdminKos by ID with profile
   */
  static async getAdminKosById(id: string): Promise<Result<AdminKosRegistrationResult | null>> {
    try {
      const user = await db.user.findUnique({
        where: { 
          id,
          role: "ADMINKOS",
        },
        include: {
          adminKosProfile: true,
        },
      });

      if (!user || !user.adminKosProfile) {
        return ok(null);
      }

      return ok({
        user,
        profile: user.adminKosProfile,
      });
    } catch (error) {
      console.error("Error getting AdminKos by ID:", error);
      return internalError("Terjadi kesalahan saat mengambil data AdminKos");
    }
  }
}
