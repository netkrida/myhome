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
 * Default: Cloudinary (recommended for production)
 * Can be switched to local storage via env var (for development only)
 */
export function getStorageAdapter(): StorageAdapter {
  const provider = process.env.ASSET_STORAGE ?? "cloudinary";
  
  if (provider === "cloudinary") {
    // Check if Cloudinary is configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_SECRET
    ) {
      const { CloudinaryAdapter } = require("./cloudinary.adapter");
      console.log("✅ Using Cloudinary storage adapter");
      return new CloudinaryAdapter();
    } else {
      console.warn("⚠️ Cloudinary not configured, falling back to local storage");
    }
  }
  
  if (provider === "local") {
    console.warn("⚠️ Using local storage adapter (not recommended for serverless)");
    const { LocalStorageAdapter } = require("./local.adapter");
    return new LocalStorageAdapter();
  }
  
  // Default to Cloudinary
  const { CloudinaryAdapter } = require("./cloudinary.adapter");
  console.log("✅ Using Cloudinary storage adapter (default)");
  return new CloudinaryAdapter();
}

