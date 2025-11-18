/**
 * Client-side Cloudinary utilities
 * This file contains ONLY client-safe functions without Node.js dependencies
 */

/**
 * Get Cloudinary URL from public_id or return URL as-is if already a full URL
 * This is useful when you have public_id stored in database
 *
 * @example
 * // With public_id
 * getCloudinaryUrl('kos-properties/advertisements/abc123')
 * // Returns: https://res.cloudinary.com/dg0ybxdbt/image/upload/kos-properties/advertisements/abc123
 *
 * // With full URL
 * getCloudinaryUrl('https://example.com/image.jpg')
 * // Returns: https://example.com/image.jpg
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
 * Generate optimized Cloudinary image URL with transformations
 *
 * @example
 * getOptimizedCloudinaryUrl('kos-properties/image123', { width: 800, height: 600 })
 * // Returns: https://res.cloudinary.com/dg0ybxdbt/image/upload/w_800,h_600,c_fill,q_auto,f_auto/kos-properties/image123
 */
export function getOptimizedCloudinaryUrl(
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

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dg0ybxdbt';

  const transformations = [
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
    `q_${quality}`,
    `f_${format}`
  ].join(',');

  return `https://res.cloudinary.com/${cloud}/image/upload/${transformations}/${publicId}`;
}

/**
 * Generate thumbnail URL for image preview
 *
 * @example
 * getThumbnailUrl('kos-properties/image123')
 * // Returns optimized thumbnail URL (200x150)
 */
export function getThumbnailUrl(publicId: string): string {
  return getOptimizedCloudinaryUrl(publicId, {
    width: 200,
    height: 150,
    crop: 'fill',
    quality: 'auto',
  });
}

/**
 * Validate image file before upload (client-side validation)
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
