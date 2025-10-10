/**
 * Storage Adapter Interface
 * Abstraction for file storage (local, Cloudinary, S3, etc.)
 */

export type UploadResult = {
  url: string;
  path?: string;
  publicId?: string;
};

export interface StorageAdapter {
  /**
   * Upload avatar image
   * @param params Upload parameters
   * @returns Upload result with public URL
   */
  uploadAvatar(params: {
    userId: string;
    file: Buffer;
    filename: string;
    mime: string;
  }): Promise<UploadResult>;

  /**
   * Delete file (optional, for cleanup)
   * @param path File path or public ID
   */
  deleteFile?(path: string): Promise<void>;
}

/**
 * Get storage adapter based on environment configuration
 * Default: local storage
 * Can be switched to Cloudinary via env var
 */
export function getStorageAdapter(): StorageAdapter {
  const provider = process.env.ASSET_STORAGE ?? "local";
  
  if (provider === "cloudinary") {
    // Future: Cloudinary adapter
    // return new CloudinaryAdapter();
    console.warn("Cloudinary adapter not implemented yet, falling back to local");
  }
  
  // Default to local storage
  const { LocalStorageAdapter } = require("./local.adapter");
  return new LocalStorageAdapter();
}

