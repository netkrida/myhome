"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearInvalidSession, forceValidateAndCleanup } from "@/lib/auth-utils";
import { LogoutHandler } from "@/lib/logout-handler";
import { EmergencyLogoutButton } from "@/components/auth/logout-button";
import { ClientSessionCleanup } from "@/lib/client-session-cleanup";
import { IconLoader2, IconTrash, IconAlertTriangle } from "@tabler/icons-react";

/**
 * Force logout component for debugging session issues
 */
export function ForceLogout() {
  const [isClearing, setIsClearing] = useState(false);
  const [isEmergencyReset, setIsEmergencyReset] = useState(false);

  const handleForceLogout = async () => {
    setIsClearing(true);
    console.log("🔍 Force Logout - Using comprehensive logout handler");

    try {
      await LogoutHandler.performLogout({
        callbackUrl: "/login",
        redirect: true,
      });
    } catch (error) {
      console.error("❌ Force Logout - Error:", error);
      // Use emergency logout as fallback
      await LogoutHandler.performEmergencyLogout("/login");
    } finally {
      setIsClearing(false);
    }
  };

  const handleEmergencyReset = async () => {
    setIsEmergencyReset(true);
    console.log("🚨 Emergency Reset - Starting nuclear option");

    try {
      // 1. Call emergency reset API
      const response = await fetch("/api/auth/emergency-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      console.log("🚨 Emergency Reset API response:", result);

      // 2. Client-side nuclear cleanup
      ClientSessionCleanup.performFullCleanup();

      // 3. Clear IndexedDB
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
          console.log("🧹 Emergency Reset - IndexedDB cleared");
        } catch (error) {
          console.error("❌ Emergency Reset - Error clearing IndexedDB:", error);
        }
      }

      // 4. Clear service worker caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log("🧹 Emergency Reset - Service worker caches cleared");
        } catch (error) {
          console.error("❌ Emergency Reset - Error clearing caches:", error);
        }
      }

      alert("🚨 EMERGENCY RESET COMPLETE!\n\nAll authentication data has been cleared.\nPlease close ALL browser windows and tabs, then reopen the browser.");

      // Force multiple redirects to ensure cleanup
      setTimeout(() => {
        window.location.replace("/login");
      }, 1000);

    } catch (error) {
      console.error("❌ Emergency Reset - Error:", error);
      alert("Emergency reset encountered errors. Please manually clear browser data and restart the browser.");
      window.location.href = "/login";
    } finally {
      setIsEmergencyReset(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-2">
        <div className="text-xs text-gray-600 font-medium">Session Debug Tools</div>

        <Button
          onClick={handleForceLogout}
          variant="destructive"
          size="sm"
          className="w-full"
          disabled={isClearing || isEmergencyReset}
        >
          {isClearing && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!isClearing && <IconTrash className="mr-2 h-4 w-4" />}
          {isClearing ? "Clearing..." : "Force Clear Session"}
        </Button>

        <EmergencyLogoutButton
          className="w-full border-red-500 text-red-500 hover:bg-red-50"
        >
          Emergency Logout
        </EmergencyLogoutButton>

        <div className="text-xs text-gray-500 leading-tight">
          Use "Force Clear" first. Use "Emergency Reset" only if stuck in login loops.
        </div>
      </div>
    </div>
  );
}
