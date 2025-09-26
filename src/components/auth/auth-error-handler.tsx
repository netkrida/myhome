"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { clearInvalidSession } from "@/lib/auth-utils";

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication error handler
 * Handles session expiration and redirects users to login when needed
 */
export function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only handle authentication for protected routes
    if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/profile") && !pathname.startsWith("/settings")) {
      return;
    }

    // If session is loading, wait
    if (status === "loading") {
      console.log("🔍 AuthErrorHandler - Session loading...");
      return;
    }

    // If no session and we're on a protected route, redirect to login
    if (status === "unauthenticated" || !session) {
      console.log("❌ AuthErrorHandler - No session, clearing and redirecting to login");

      // Show toast notification for session expiration
      toast.error("Session expired. Please login again.", {
        duration: 3000,
      });

      // Clear invalid session and redirect
      clearInvalidSession(pathname);
      return;
    }

    // If session exists but user data is missing, something is wrong
    if (session && (!session.user?.id || !session.user?.role)) {
      console.log("❌ AuthErrorHandler - Invalid session data, clearing and redirecting to login");

      // Show toast notification for invalid session
      toast.error("Invalid session. Please login again.", {
        duration: 3000,
      });

      // Clear invalid session and redirect
      clearInvalidSession(pathname);
      return;
    }

    console.log("✅ AuthErrorHandler - Session valid:", {
      userId: session.user.id,
      userRole: session.user.role,
    });
  }, [session, status, pathname, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we're on a protected route and there's no session, show loading
  // (the useEffect will handle the redirect)
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/profile") || pathname.startsWith("/settings")) &&
    (status === "unauthenticated" || !session)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
