/**
 * Avatar Service
 * Business logic for avatar upload and management
 * Tier 3: Domain Service
 */

"use server";

import { getStorageAdapter } from "@/server/adapters/storage";
import { UserRepository } from "@/server/repositories/user.repository";
import { validateAvatarFile } from "@/server/schemas/settings";

export interface UploadAvatarParams {
  buffer: Buffer;
  filename: string;
  mime: string;
  size: number;
}

/**
 * Upload user avatar
 * Validates file, uploads to storage, and updates user profile
 * @param userId User ID
 * @param file File data
 * @returns Upload result with public URL
 */
export async function uploadMyAvatar(
  userId: string,
  file: UploadAvatarParams
): Promise<{ url: string }> {
  // Validate file type and size
  validateAvatarFile({ mime: file.mime, size: file.size });

  // Get storage adapter
  const storage = getStorageAdapter();

  // Upload file
  const result = await storage.uploadAvatar({
    userId,
    file: file.buffer,
    filename: file.filename,
    mime: file.mime,
  });

  // Update user profile with new avatar URL
  await UserRepository.update(userId, { image: result.url });

  return { url: result.url };
}

/**
 * Delete user avatar
 * Removes avatar from storage and clears user profile image
 * @param userId User ID
 */
export async function deleteMyAvatar(userId: string): Promise<void> {
  // Get user to find current avatar
  const user = await UserRepository.findById(userId);
  if (!user || !user.image) {
    return; // No avatar to delete
  }

  // Clear avatar from user profile
  await UserRepository.update(userId, { image: null });

  // Optional: Delete file from storage
  // This depends on storage adapter implementation
  // For local storage, we might want to keep old files for backup
  // For Cloudinary, we might want to delete to save space
}

