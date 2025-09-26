"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Component to handle role-based redirects after login
 */
export function RoleRedirect({ 
  callbackUrl, 
  onRedirect 
}: { 
  callbackUrl?: string;
  onRedirect?: () => void;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === "loading" || isRedirecting) return;

    console.log("🔍 RoleRedirect - Session status:", {
      status,
      hasSession: !!session,
      role: session?.user?.role,
      callbackUrl,
      currentUrl: window.location.href
    });

    if (status === "authenticated" && session?.user?.role) {
      setIsRedirecting(true);

      console.log("🔄 RoleRedirect - Redirecting user:", {
        role: session.user.role,
        callbackUrl,
        userId: session.user.id,
        currentUrl: window.location.href
      });

      // If there's a callback URL, use it
      if (callbackUrl && callbackUrl !== "/login") {
        console.log("🔄 RoleRedirect - Using callback URL:", callbackUrl);
        router.push(callbackUrl);
        onRedirect?.();
        return;
      }

      // Otherwise, redirect based on role
      const role = session.user.role.toLowerCase();
      let redirectUrl = "/";

      switch (role) {
        case "superadmin":
          redirectUrl = "/dashboard/superadmin";
          break;
        case "adminkos":
          redirectUrl = "/dashboard/adminkos";
          break;
        case "receptionist":
          redirectUrl = "/dashboard/receptionist";
          break;
        case "customer":
          redirectUrl = "/"; // Customer goes to homepage
          break;
        default:
          console.warn("⚠️ RoleRedirect - Unknown role:", role);
          redirectUrl = "/";
      }

      console.log("🔄 RoleRedirect - Redirecting to:", redirectUrl);
      router.push(redirectUrl);
      onRedirect?.();
    }
  }, [session, status, callbackUrl, router, onRedirect, isRedirecting]);

  // Show loading state while redirecting
  if (status === "loading" || isRedirecting) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Redirecting...</span>
      </div>
    );
  }

  return null;
}

/**
 * Hook for role-based redirect logic
 */
export function useRoleRedirect(callbackUrl?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const performRedirect = () => {
    if (status !== "authenticated" || !session?.user?.role) {
      return false;
    }

    // If there's a callback URL, use it
    if (callbackUrl && callbackUrl !== "/login") {
      router.push(callbackUrl);
      return true;
    }

    // Otherwise, redirect based on role
    const role = session.user.role.toLowerCase();
    let redirectUrl = "/";

    switch (role) {
      case "superadmin":
        redirectUrl = "/dashboard/superadmin";
        break;
      case "adminkos":
        redirectUrl = "/dashboard/adminkos";
        break;
      case "receptionist":
        redirectUrl = "/dashboard/receptionist";
        break;
      case "customer":
        redirectUrl = "/";
        break;
      default:
        redirectUrl = "/";
    }

    router.push(redirectUrl);
    return true;
  };

  return {
    canRedirect: status === "authenticated" && !!session?.user?.role,
    performRedirect,
    isLoading: status === "loading"
  };
}
