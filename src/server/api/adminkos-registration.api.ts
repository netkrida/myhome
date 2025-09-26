import { AdminKosRegistrationService } from "../services/adminkos-registration.service";
import { adminKosRegistrationServerSchema } from "../schemas/adminkos-registration";
import type { Result } from "../types/result";
import type { AdminKosRegistrationResult } from "../types/adminkos";

/**
 * Application service for AdminKos registration
 * Tier 2: Application services/use-cases
 */
export class AdminKosRegistrationAPI {
  /**
   * Register a new AdminKos user
   */
  static async registerAdminKos(
    input: unknown
  ): Promise<Result<AdminKosRegistrationResult>> {
    try {
      // Validate input
      const validationResult = adminKosRegistrationServerSchema.safeParse(input);
      
      if (!validationResult.success) {
        return {
          success: false,
          error: "Data tidak valid",
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }

      const data = validationResult.data;

      // Call domain service
      const result = await AdminKosRegistrationService.registerAdminKos(data);

      if (!result.success) {
        return result;
      }

      // Return success without sensitive data
      return {
        success: true,
        data: {
          user: {
            ...result.data.user,
            password: undefined, // Remove password from response
          },
          profile: result.data.profile,
        } as AdminKosRegistrationResult,
      };
    } catch (error) {
      console.error("Error in AdminKos registration API:", error);
      return {
        success: false,
        error: "Terjadi kesalahan saat mendaftarkan akun",
      };
    }
  }

  /**
   * Check if email is available
   */
  static async checkEmailAvailability(email: string): Promise<Result<boolean>> {
    try {
      if (!email || typeof email !== 'string') {
        return {
          success: false,
          error: "Email tidak valid",
        };
      }

      const result = await AdminKosRegistrationService.isEmailAvailable(email);
      return result;
    } catch (error) {
      console.error("Error checking email availability:", error);
      return {
        success: false,
        error: "Terjadi kesalahan saat memeriksa email",
      };
    }
  }

  /**
   * Get AdminKos profile by user ID
   */
  static async getAdminKosProfile(userId: string): Promise<Result<AdminKosRegistrationResult | null>> {
    try {
      if (!userId || typeof userId !== 'string') {
        return {
          success: false,
          error: "User ID tidak valid",
        };
      }

      const result = await AdminKosRegistrationService.getAdminKosById(userId);
      
      if (!result.success) {
        return result;
      }

      // Remove password from response if user exists
      if (result.data) {
        return {
          success: true,
          data: {
            user: {
              ...result.data.user,
              password: undefined,
            },
            profile: result.data.profile,
          } as AdminKosRegistrationResult,
        };
      }

      return result;
    } catch (error) {
      console.error("Error getting AdminKos profile:", error);
      return {
        success: false,
        error: "Terjadi kesalahan saat mengambil profil AdminKos",
      };
    }
  }
}
