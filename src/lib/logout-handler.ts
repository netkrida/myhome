"use client";

import { signOut } from "next-auth/react";
import { ClientSessionCleanup } from "./client-session-cleanup";

/**
 * Comprehensive logout handler for production and development
 * Handles all logout scenarios including production cookie clearing
 */
export class LogoutHandler {
  /**
   * Standard logout with comprehensive cleanup
   */
  static async performLogout(options?: {
    callbackUrl?: string;
    redirect?: boolean;
  }): Promise<void> {
    const { callbackUrl = "/login", redirect = true } = options || {};
    
    try {
      console.log("🚪 Logout - Starting comprehensive logout process");

      // 1. Clear client-side storage first
      ClientSessionCleanup.performFullCleanup();

      // 2. Call our dedicated logout API for comprehensive server-side cleanup
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("✅ Logout - Server-side logout completed");
      } catch (error) {
        console.warn("⚠️ Logout - Server-side logout failed, trying fallback:", error);

        // Fallback to clear-session API
        try {
          await fetch("/api/auth/clear-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log("✅ Logout - Fallback session clearing completed");
        } catch (fallbackError) {
          console.warn("⚠️ Logout - Fallback also failed, continuing:", fallbackError);
        }
      }

      // 3. Use NextAuth signOut with proper options
      await signOut({
        redirect,
        callbackUrl,
      });

      console.log("✅ Logout - NextAuth signOut completed");

      // 4. Force page reload if not redirecting (for SPA scenarios)
      if (!redirect) {
        setTimeout(() => {
          window.location.href = callbackUrl;
        }, 100);
      }

    } catch (error) {
      console.error("❌ Logout - Error during logout:", error);
      
      // Fallback: force redirect to login
      this.performEmergencyLogout(callbackUrl);
    }
  }

  /**
   * Emergency logout when standard logout fails
   */
  static async performEmergencyLogout(callbackUrl: string = "/login"): Promise<void> {
    try {
      console.log("🚨 Logout - Performing emergency logout");

      // 1. Comprehensive client cleanup
      ClientSessionCleanup.performFullCleanup();

      // 2. Try emergency reset API
      try {
        await fetch("/api/auth/emergency-reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.warn("⚠️ Logout - Emergency reset API failed:", error);
      }

      // 3. Clear all possible cookies manually
      this.clearAllAuthCookies();

      // 4. Force redirect
      window.location.href = callbackUrl;

    } catch (error) {
      console.error("❌ Logout - Emergency logout failed:", error);
      // Last resort
      window.location.href = callbackUrl;
    }
  }

  /**
   * Clear all possible authentication cookies manually
   */
  private static clearAllAuthCookies(): void {
    const authCookieNames = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "authjs.csrf-token",
      "__Secure-authjs.csrf-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "authjs.callback-url",
      "__Secure-authjs.callback-url",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
    ];

    authCookieNames.forEach(cookieName => {
      // Clear for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
      // Clear for parent domain (for Vercel subdomains)
      const hostname = window.location.hostname;
      if (hostname.includes('.')) {
        const parentDomain = hostname.split('.').slice(-2).join('.');
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${parentDomain};`;
      }
      
      // Clear for Vercel domain specifically
      if (hostname.includes('vercel.app')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.vercel.app;`;
      }
    });

    console.log("🧹 Logout - Manual cookie clearing completed");
  }

  /**
   * Quick logout for UI components (with error handling)
   */
  static async quickLogout(): Promise<void> {
    try {
      await this.performLogout({
        callbackUrl: "/login",
        redirect: true,
      });
    } catch (error) {
      console.error("❌ Logout - Quick logout failed:", error);
      await this.performEmergencyLogout("/login");
    }
  }

  /**
   * Logout with custom callback URL
   */
  static async logoutWithCallback(callbackUrl: string): Promise<void> {
    try {
      await this.performLogout({
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("❌ Logout - Callback logout failed:", error);
      await this.performEmergencyLogout(callbackUrl);
    }
  }
}
