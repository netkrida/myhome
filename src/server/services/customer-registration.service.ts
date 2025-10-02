import bcrypt from "bcryptjs";

import { db } from "../db";
import type { CustomerRegistrationData, CustomerRegistrationResult } from "../types/customer";
import { conflict, internalError, ok } from "../types/result";
import type { Result } from "../types/result";

export class CustomerRegistrationService {
  static async registerCustomer(
    data: CustomerRegistrationData
  ): Promise<Result<CustomerRegistrationResult>> {
    try {
      const existingUser = await db.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return conflict("Email sudah terdaftar");
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);

      const record = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: data.fullName,
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
            role: "CUSTOMER",
            isActive: true,
          },
        });

        const profile = await tx.customerProfile.create({
          data: {
            userId: user.id,
            institutionName: data.status === "MAHASISWA" ? data.institutionName ?? null : null,
          },
        });

        return { user, profile };
      });

      return ok(record, 201);
    } catch (error) {
      console.error("Error registering customer:", error);
      return internalError("Terjadi kesalahan saat mendaftarkan akun");
    }
  }

  static async isEmailAvailable(email: string): Promise<Result<boolean>> {
    try {
      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      return ok(!existingUser);
    } catch (error) {
      console.error("Error checking customer email availability:", error);
      return internalError("Terjadi kesalahan saat memeriksa email");
    }
  }
}
