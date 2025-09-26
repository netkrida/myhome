"use client";

/**
 * Client-side session cleanup utilities
 * This file contains only client-side cleanup functions
 */

/**
 * Client-side session cleanup utility
 */
export class ClientSessionCleanup {
  /**
   * Clear all browser storage related to authentication
   */
  static clearBrowserStorage(): void {
    if (typeof window === "undefined") {
      console.log("⚠️ Client cleanup - Not in browser environment");
      return;
    }

    try {
      // Clear localStorage
      const localStorageKeys = Object.keys(localStorage);
      let localCleared = 0;
      
      localStorageKeys.forEach(key => {
        if (this.isAuthRelatedKey(key)) {
          localStorage.removeItem(key);
          localCleared++;
          console.log(`🧹 Client cleanup - Cleared localStorage: ${key}`);
        }
      });

      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      let sessionCleared = 0;
      
      sessionStorageKeys.forEach(key => {
        if (this.isAuthRelatedKey(key)) {
          sessionStorage.removeItem(key);
          sessionCleared++;
          console.log(`🧹 Client cleanup - Cleared sessionStorage: ${key}`);
        }
      });

      // Clear all sessionStorage as a safety measure
      sessionStorage.clear();

      console.log(`✅ Client cleanup - Cleared ${localCleared} localStorage and ${sessionStorageKeys.length} sessionStorage items`);
    } catch (error) {
      console.error("❌ Client cleanup - Error clearing browser storage:", error);
    }
  }

  /**
   * Clear browser cookies (client-side accessible ones)
   */
  static clearBrowserCookies(): void {
    if (typeof document === "undefined") {
      console.log("⚠️ Client cleanup - Not in browser environment");
      return;
    }

    try {
      // Get all cookies
      const cookies = document.cookie.split(';');
      let clearedCount = 0;

      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        if (this.isAuthRelatedKey(name)) {
          // Clear cookie by setting it to expire in the past
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
          clearedCount++;
          console.log(`🧹 Client cleanup - Cleared browser cookie: ${name}`);
        }
      });

      console.log(`✅ Client cleanup - Cleared ${clearedCount} browser cookies`);
    } catch (error) {
      console.error("❌ Client cleanup - Error clearing browser cookies:", error);
    }
  }

  /**
   * Comprehensive client-side cleanup
   */
  static performFullCleanup(): void {
    console.log("🧹 Client cleanup - Starting comprehensive cleanup");
    
    this.clearBrowserStorage();
    this.clearBrowserCookies();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('auth') || cacheName.includes('session')) {
            caches.delete(cacheName);
            console.log(`🧹 Client cleanup - Cleared cache: ${cacheName}`);
          }
        });
      }).catch(error => {
        console.error("❌ Client cleanup - Error clearing caches:", error);
      });
    }

    console.log("✅ Client cleanup - Comprehensive cleanup completed");
  }

  /**
   * Emergency cleanup - force clear everything
   */
  static async emergencyCleanup(): Promise<void> {
    console.log("🚨 Emergency cleanup - Starting emergency session cleanup");

    try {
      this.performFullCleanup();

      // Clear IndexedDB
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve(undefined);
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            })
          );
          console.log("🧹 Emergency cleanup - IndexedDB cleared");
        } catch (error) {
          console.error("❌ Emergency cleanup - Error clearing IndexedDB:", error);
        }
      }

      // Clear service worker caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log("🧹 Emergency cleanup - Service worker caches cleared");
        } catch (error) {
          console.error("❌ Emergency cleanup - Error clearing caches:", error);
        }
      }

      // Force reload after cleanup
      setTimeout(() => {
        console.log("🔄 Emergency cleanup - Force reloading page");
        window.location.href = "/login";
      }, 1000);

      console.log("✅ Emergency cleanup - Emergency cleanup completed");
    } catch (error) {
      console.error("❌ Emergency cleanup - Emergency cleanup failed:", error);
      
      // Last resort - force redirect
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  /**
   * Check if a key is related to authentication
   */
  private static isAuthRelatedKey(key: string): boolean {
    const authKeywords = [
      'auth', 'session', 'token', 'user', 'login', 'credential',
      'next-auth', 'authjs', 'oauth', 'csrf', 'callback',
      'discord', 'google', 'github', 'provider'
    ];

    const lowerKey = key.toLowerCase();
    return authKeywords.some(keyword => lowerKey.includes(keyword));
  }
}

/**
 * Convenience functions for easy import
 */
export const clearBrowserStorage = () => ClientSessionCleanup.clearBrowserStorage();
export const clearBrowserCookies = () => ClientSessionCleanup.clearBrowserCookies();
export const performFullCleanup = () => ClientSessionCleanup.performFullCleanup();
export const emergencyCleanup = () => ClientSessionCleanup.emergencyCleanup();
