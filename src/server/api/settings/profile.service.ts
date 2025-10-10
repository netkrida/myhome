/**
 * Profile Service
 * Business logic for user profile management
 * Tier 3: Domain Service
 */

"use server";

import { UserRepository } from "@/server/repositories/user.repository";
import { UpdateProfileSchema, type UpdateProfileInput } from "@/server/schemas/settings";
import type { User } from "@prisma/client";

/**
 * Get user profile by ID
 * @param userId User ID
 * @returns User profile data
 */
export async function getMyProfile(userId: string): Promise<User | null> {
  return UserRepository.findById(userId);
}

/**
 * Update user profile
 * @param userId User ID
 * @param input Profile update data
 * @returns Updated user profile
 */
export async function updateMyProfile(userId: string, input: unknown): Promise<User> {
  // Validate input
  const data = UpdateProfileSchema.parse(input);

  // If email is being changed, check uniqueness
  if (data.email) {
    const existingUser = await UserRepository.findByEmail(data.email);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email sudah digunakan oleh user lain");
    }
  }

  // Update user profile
  return UserRepository.update(userId, {
    name: data.name,
    email: data.email,
    phoneNumber: data.phoneNumber,
    provinceCode: data.provinceCode,
    provinceName: data.provinceName,
    regencyCode: data.regencyCode,
    regencyName: data.regencyName,
    districtCode: data.districtCode,
    districtName: data.districtName,
    streetAddress: data.streetAddress,
  });
}

