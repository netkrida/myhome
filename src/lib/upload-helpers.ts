/**
 * Client-side upload helpers
 * These functions are safe to use in client components
 */

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type?: string;
  bytes: number;
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
 * Upload image from browser to server
 */
export async function uploadImageFromBrowser(
  file: File,
  category: string,
  subcategory?: string
): Promise<UploadResult> {
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

  const result = await response.json();

  console.log('Upload response:', {
    ok: response.ok,
    status: response.status,
    result
  });

  if (!response.ok || !result.success) {
    const errorMsg = result.error || 'Failed to upload image';
    console.error('Upload failed:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!result.data) {
    console.error('No data in response:', result);
    throw new Error('No image data returned from server');
  }

  return result.data;
}
