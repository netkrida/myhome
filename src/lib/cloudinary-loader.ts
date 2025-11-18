/**
 * Custom Cloudinary Image Loader for Next.js
 * This ensures images load correctly in production environment
 */

export interface CloudinaryLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom image loader for Cloudinary
 * Optimizes images with Cloudinary transformations
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: CloudinaryLoaderProps): string {
  // If already a full Cloudinary URL with transformations, use it directly
  if (src.startsWith('https://res.cloudinary.com')) {
    // Check if URL already has transformations
    if (src.includes('/upload/v')) {
      // URL already has version, return as is
      return src;
    }

    // Add transformations to existing Cloudinary URL
    const cloudName = 'dg0ybxdbt';
    const params = [
      'f_auto', // Auto format (WebP, AVIF, etc.)
      'c_limit', // Limit to preserve aspect ratio
      `w_${width}`, // Width transformation
      `q_${quality || 'auto'}`, // Quality (auto or specified)
    ];

    // Extract the part after /upload/
    const uploadIndex = src.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const beforeUpload = src.substring(0, uploadIndex + 8); // includes '/upload/'
      const afterUpload = src.substring(uploadIndex + 8);
      return `${beforeUpload}${params.join(',')}/${afterUpload}`;
    }

    return src;
  }

  // If it's a full URL from another domain (e.g., unsplash), return as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // If it's a local public image (starts with /)
  if (src.startsWith('/')) {
    return src;
  }

  // Otherwise construct Cloudinary URL with transformations
  const cloudName = 'dg0ybxdbt';
  const params = [
    'f_auto', // Auto format (WebP, AVIF, etc.)
    'c_limit', // Limit to preserve aspect ratio
    `w_${width}`, // Width transformation
    `q_${quality || 'auto'}`, // Quality (auto or specified)
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(',')}/${src}`;
}
