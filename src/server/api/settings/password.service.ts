/**
 * Password Service
 * Business logic for password management
 * Tier 3: Domain Service
 */

"use server";

import bcrypt from "bcryptjs";
import { UserRepository } from "@/server/repositories/user.repository";
import { ChangePasswordSchema, type ChangePasswordInput } from "@/server/schemas/settings";

/**
 * Change user password
 * Verifies current password and updates to new password
 * @param userId User ID
 * @param input Password change data
 * @returns Success result
 */
export async function changeMyPassword(userId: string, input: unknown): Promise<{ ok: boolean }> {
  // Validate input
  const { currentPassword, newPassword } = ChangePasswordSchema.parse(input);

  // Get user
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  // Check if user has password
  if (!user.password) {
    throw new Error("Akun belum memiliki password. Silakan set password terlebih dahulu.");
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error("Password saat ini salah");
  }

  // Check if new password is same as current
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new Error("Password baru tidak boleh sama dengan password saat ini");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await UserRepository.updatePassword(userId, hashedPassword);

  return { ok: true };
}

