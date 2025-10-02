import { CustomerRegistrationService } from "../services/customer-registration.service";
import { customerRegistrationServerSchema } from "../schemas/customer-registration";
import type { Result } from "../types/result";
import type { CustomerRegistrationResult } from "../types/customer";

export class CustomerRegistrationAPI {
  static async registerCustomer(
    input: unknown
  ): Promise<Result<CustomerRegistrationResult>> {
    try {
      const validationResult = customerRegistrationServerSchema.safeParse(input);

      if (!validationResult.success) {
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Data tidak valid",
            details: {
              errors: validationResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
              })),
            },
          },
          statusCode: 400,
        };
      }

      const result = await CustomerRegistrationService.registerCustomer(validationResult.data);

      if (!result.success || !result.data) {
        return result;
      }

      const { password, ...userWithoutPassword } = result.data.user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          profile: result.data.profile,
        } as CustomerRegistrationResult,
        statusCode: 201,
      };
    } catch (error) {
      console.error("Error in Customer registration API:", error);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Terjadi kesalahan saat mendaftarkan akun",
        },
        statusCode: 500,
      };
    }
  }
}
