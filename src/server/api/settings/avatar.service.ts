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

  // Get current user to delete old avatar
  const user = await UserRepository.findById(userId);
  
  // Get storage adapter
  const storage = getStorageAdapter();

  // Delete old avatar if exists
  if (user?.image && storage.deleteFile) {
    try {
      // Extract publicId from Cloudinary URL if applicable
      if (user.image.includes('cloudinary.com')) {
        const urlParts = user.image.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileWithExt?.split('.')[0]}`;
        await storage.deleteFile(publicId);
        console.log("🗑️ Old avatar deleted:", publicId);
      }
    } catch (error) {
      console.error("⚠️ Failed to delete old avatar:", error);
      // Continue with upload even if deletion fails
    }
  }

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

  // Get storage adapter
  const storage = getStorageAdapter();

  // Delete file from storage if supported
  if (storage.deleteFile) {
    try {
      // Extract publicId from Cloudinary URL if applicable
      if (user.image.includes('cloudinary.com')) {
        const urlParts = user.image.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileWithExt?.split('.')[0]}`;
        await storage.deleteFile(publicId);
        console.log("🗑️ Avatar deleted from storage:", publicId);
      }
    } catch (error) {
      console.error("⚠️ Failed to delete avatar from storage:", error);
      // Continue to clear from database even if storage deletion fails
    }
  }

  // Clear avatar from user profile
  await UserRepository.update(userId, { image: null });
}

