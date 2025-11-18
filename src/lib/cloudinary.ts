/**
 * Cloudinary integration utilities for image uploads
 * Supports multi-category image uploads with proper error handling
 */

import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dg0ybxdbt',
  api_key: process.env.CLOUDINARY_API_KEY || '836543447587342',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'joI9lZdqjlWNyCEnJ5gh0ugYuzQ',
});

// Debug: Log configuration status (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dg0ybxdbt',
    api_key: process.env.CLOUDINARY_API_KEY || '836543447587342',
    cloud_name_set: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key_set: !!process.env.CLOUDINARY_API_KEY,
    api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
    using_env_vars: !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY && !!process.env.CLOUDINARY_API_SECRET,
  });
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

export interface ImageUploadOptions {
  folder?: string;
  transformation?: any[];
  tags?: string[];
  context?: Record<string, string>;
}

/**
 * Upload a single image to Cloudinary
 */
export async function uploadImage(
  file: File | Buffer | string,
  options: ImageUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || 'kos-properties',
      upload_preset: 'ml_default',
      transformation: options.transformation || [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      tags: options.tags || [],
      context: options.context || {},
    };

    let uploadData: string;

    if (file instanceof File) {
      // Convert File to base64 data URL for server-side upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || 'image/jpeg';
      uploadData = `data:${mimeType};base64,${buffer.toString('base64')}`;
    } else if (file instanceof Buffer) {
      // Convert Buffer to base64 data URL
      uploadData = `data:image/jpeg;base64,${file.toString('base64')}`;
    } else {
      // Assume it's already a string (URL or base64)
      uploadData = file as string;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(uploadData, uploadOptions);
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultipleImages(
  files: File[],
  options: ImageUploadOptions = {}
): Promise<CloudinaryUploadResult[]> {
  try {
    const uploadPromises = files.map(file => uploadImage(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple image upload error:', error);
    throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<void> {
  try {
    const deletePromises = publicIds.map(publicId => deleteImage(publicId));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Multiple image delete error:', error);
    throw new Error(`Failed to delete images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string {
  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
  });
}

/**
 * Client-side image upload function for browser environments
 */
export async function uploadImageFromBrowser(
  file: File,
  category: string,
  subcategory?: string
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (subcategory) {
    formData.append('subcategory', subcategory);
  }

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload image');
  }

  return await response.json();
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}

/**
 * Generate thumbnail URL for image preview
 */
export function getThumbnailUrl(publicId: string): string {
  return getOptimizedImageUrl(publicId, {
    width: 200,
    height: 150,
    crop: 'fill',
    quality: 'auto',
  });
}

/**
 * Get Cloudinary URL from public_id or return URL as-is if already a full URL
 * This is useful when you have public_id stored in database
 */
export function getCloudinaryUrl(publicIdOrUrl: string, cloudName?: string): string {
  // If it's already a full URL (http/https), return as-is
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
    return publicIdOrUrl;
  }

  // Otherwise, construct Cloudinary URL from public_id
  const cloud = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dg0ybxdbt';
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicIdOrUrl}`;
}

/**
 * Upload to Cloudinary with options
 * Used by storage adapters
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "myhome",
  options?: {
    public_id?: string;
    resource_type?: string;
    format?: string;
  }
): Promise<CloudinaryUploadResult> {
  try {
    const uploadData = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    const uploadOptions: any = {
      folder,
      upload_preset: 'ml_default',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ],
    };

    if (options?.public_id) {
      uploadOptions.public_id = options.public_id;
    }
    if (options?.resource_type) {
      uploadOptions.resource_type = options.resource_type;
    }
    if (options?.format) {
      uploadOptions.format = options.format;
    }

    const result = await cloudinary.uploader.upload(uploadData, uploadOptions);
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete from Cloudinary
 * Used by storage adapters
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export { cloudinary };
