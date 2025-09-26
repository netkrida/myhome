"use client";

import { signOut } from "next-auth/react";

/**
 * Clear all browser storage data
 */
function clearBrowserStorage() {
  if (typeof window === "undefined") return;

  try {
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.includes('auth') || key.includes('session') || key.includes('user') || key.includes('token')) {
        localStorage.removeItem(key);
        console.log(`🧹 Cleared localStorage: ${key}`);
      }
    });

    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.includes('auth') || key.includes('session') || key.includes('user') || key.includes('token')) {
        sessionStorage.removeItem(key);
        console.log(`🧹 Cleared sessionStorage: ${key}`);
      }
    });

    // Clear all sessionStorage (safer approach)
    sessionStorage.clear();

    console.log("✅ Browser storage cleared");
  } catch (error) {
    console.error("❌ Error clearing browser storage:", error);
  }
}

/**
 * Clear invalid session and redirect to login
 */
export async function clearInvalidSession(callbackUrl?: string) {
  try {
    console.log("🔍 Auth Utils - Clearing invalid session");

    // Clear browser storage first
    clearBrowserStorage();

    // Call our clear session API
    const response = await fetch("/api/auth/clear-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    console.log("🔍 Auth Utils - Clear session API response:", result);

    // Sign out from NextAuth (this will clear client-side session)
    await signOut({
      redirect: true,
      callbackUrl: callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"
    });

    console.log("✅ Auth Utils - Session cleared and redirected");

  } catch (error) {
    console.error("❌ Auth Utils - Error clearing session:", error);

    // Fallback: clear storage and force redirect
    clearBrowserStorage();
    window.location.href = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
  }
}

/**
 * Validate current session against database
 */
export async function validateSession(): Promise<{
  valid: boolean;
  user?: any;
  reason?: string;
}> {
  try {
    console.log("🔍 Auth Utils - Validating session");

    const response = await fetch("/api/auth/validate-session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    console.log("🔍 Auth Utils - Session validation result:", {
      valid: result.valid,
      reason: result.reason
    });

    return result;
  } catch (error) {
    console.error("❌ Auth Utils - Error validating session:", error);
    return {
      valid: false,
      reason: "Network error during validation"
    };
  }
}

/**
 * Force session validation and cleanup if invalid
 */
export async function forceValidateAndCleanup(): Promise<{
  valid: boolean;
  action: string;
  reason?: string;
}> {
  try {
    console.log("🔍 Auth Utils - Force validating and cleaning session");

    const response = await fetch("/api/auth/validate-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    console.log("🔍 Auth Utils - Force validation result:", {
      valid: result.valid,
      action: result.action,
      reason: result.reason
    });

    return result;
  } catch (error) {
    console.error("❌ Auth Utils - Error in force validation:", error);
    return {
      valid: false,
      action: "error",
      reason: "Network error during force validation"
    };
  }
}

/**
 * Handle session expiration with proper cleanup
 */
export async function handleSessionExpiration(currentPath?: string) {
  console.log("🔍 Auth Utils - Handling session expiration");

  // Clear browser storage
  clearBrowserStorage();

  // Clear session and redirect
  await clearInvalidSession(currentPath || (typeof window !== "undefined" ? window.location.pathname : undefined));
}

/**
 * Check session health and auto-cleanup if needed
 * This should be called periodically or on route changes
 */
export async function checkSessionHealth(): Promise<boolean> {
  try {
    console.log("🔍 Auth Utils - Checking session health");

    const validation = await validateSession();

    if (!validation.valid) {
      console.log("❌ Auth Utils - Session unhealthy, triggering cleanup:", validation.reason);

      // Auto-cleanup invalid session
      await forceValidateAndCleanup();

      // Redirect to login
      const currentPath = typeof window !== "undefined" ? window.location.pathname : undefined;
      await clearInvalidSession(currentPath);

      return false;
    }

    console.log("✅ Auth Utils - Session is healthy");
    return true;
  } catch (error) {
    console.error("❌ Auth Utils - Error checking session health:", error);
    return false;
  }
}
