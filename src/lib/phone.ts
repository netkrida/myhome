/**
 * Phone number normalization utilities
 * Converts various phone number formats to E.164 format for Indonesia
 */

/**
 * Normalize phone number to E.164 format for Indonesia (without + prefix)
 * 
 * @param raw - Raw phone number input (can be 0812..., +62812..., 62812...)
 * @returns Normalized phone number in E.164 format without + (e.g., "628123456789") or null if invalid
 * 
 * @example
 * normalizePhoneToE164ID("0812-3456-7890") // "628123456789"
 * normalizePhoneToE164ID("+62 812 3456 7890") // "628123456789"
 * normalizePhoneToE164ID("62812 3456 7890") // "628123456789"
 * normalizePhoneToE164ID("invalid") // null
 */
export function normalizePhoneToE164ID(raw?: string | null): string | null {
  if (!raw) return null;

  // Remove spaces and dashes
  const cleaned = raw.trim().replace(/[\s\-]/g, "");
  if (!cleaned) return null;

  let normalized = cleaned;

  // Remove + prefix if present
  if (normalized.startsWith("+")) {
    normalized = normalized.slice(1);
  }
  // Replace leading 0 with 62 (Indonesia country code)
  else if (normalized.startsWith("0")) {
    normalized = "62" + normalized.slice(1);
  }

  // Validate that result contains only digits
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  // Basic validation: Indonesian phone numbers should start with 62 and have reasonable length
  if (!normalized.startsWith("62") || normalized.length < 10 || normalized.length > 15) {
    return null;
  }

  return normalized;
}

