/**
 * Settings Validation Schemas
 * Zod schemas for user settings (profile, password, avatar)
 */

import { z } from "zod";

/**
 * Update Profile Schema
 * Validates user profile update data
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Email tidak valid").max(255, "Email maksimal 255 karakter").optional(),
  phoneNumber: z.string().max(20, "Nomor telepon maksimal 20 karakter").nullable().optional(),
  provinceCode: z.string().max(10).nullable().optional(),
  provinceName: z.string().max(100).nullable().optional(),
  regencyCode: z.string().max(10).nullable().optional(),
  regencyName: z.string().max(100).nullable().optional(),
  districtCode: z.string().max(10).nullable().optional(),
  districtName: z.string().max(100).nullable().optional(),
  streetAddress: z.string().max(500, "Alamat maksimal 500 karakter").nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Change Password Schema
 * Validates password change request with confirmation
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Password minimal 6 karakter"),
  newPassword: z.string()
    .min(8, "Password baru minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
    .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung minimal 1 angka"),
  confirmNewPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmNewPassword"],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Avatar Upload Validation
 */
export const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export function validateAvatarFile(file: { mime: string; size: number }) {
  if (!ALLOWED_AVATAR_TYPES.has(file.mime)) {
    throw new Error("Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP");
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("Ukuran file maksimal 2MB");
  }
}

