/**
 * Cloudinary Storage Adapter
 * Stores files on Cloudinary cloud storage
 */

import type { StorageAdapter, UploadResult } from "./index";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { randomUUID } from "crypto";

export class CloudinaryAdapter implements StorageAdapter {
  private folder: string;

  constructor() {
    // Cloudinary folder for avatars
    this.folder = process.env.CLOUDINARY_AVATAR_FOLDER ?? "myhome/avatars";
  }

  async uploadAvatar(params: {
    userId: string;
    file: Buffer;
    filename: string;
    mime: string;
  }): Promise<UploadResult> {
    const { userId, file, filename } = params;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, this.folder, {
      public_id: `${userId}-${randomUUID()}`,
      resource_type: "image",
      format: this.getFormatFromFilename(filename),
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await deleteFromCloudinary(publicId);
      console.log("🗑️ Deleted from Cloudinary:", publicId);
    } catch (error) {
      console.error("⚠️ Error deleting from Cloudinary:", error);
      // Don't throw, just log
    }
  }

  /**
   * Extract format from filename
   */
  private getFormatFromFilename(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      jpg: "jpg",
      jpeg: "jpg",
      png: "png",
      webp: "webp",
      gif: "gif",
    };
    return formatMap[ext || "jpg"] || "jpg";
  }
}
