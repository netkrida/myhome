/**
 * Toast utility functions
 * Helper functions for safely displaying error messages in toast notifications
 */

/**
 * Safely format error messages for toast notifications
 * Handles various error formats (string, object, Result type)
 * @param error - Error from API response or exception
 * @param fallback - Fallback message if error cannot be parsed
 * @returns Formatted error string safe for React rendering
 */
export function formatErrorMessage(error: any, fallback = "Terjadi kesalahan"): string {
  // If it's already a string, return it
  if (typeof error === "string") return error;
  
  // Handle Result type or API error responses
  if (error && typeof error === "object") {
    // Try message property first
    if (error.message && typeof error.message === "string") {
      return error.message;
    }
    
    // Try code property
    if (error.code && typeof error.code === "string") {
      return `Error: ${error.code}`;
    }
    
    // Handle validation errors (Zod)
    if (Array.isArray(error.details)) {
      const messages = error.details.map((e: any) => e.message).filter(Boolean);
      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
    
    // Handle nested error object
    if (error.error) {
      return formatErrorMessage(error.error, fallback);
    }
  }
  
  // Return fallback if nothing works
  return fallback;
}

/**
 * Extract error message from API response
 * @param result - API response result
 * @param fallback - Fallback message
 * @returns Error message string
 */
export function getApiErrorMessage(
  result: { success: boolean; error?: any; message?: string },
  fallback = "Terjadi kesalahan"
): string {
  if (result.message && typeof result.message === "string") {
    return result.message;
  }
  
  if (result.error) {
    return formatErrorMessage(result.error, fallback);
  }
  
  return fallback;
}
