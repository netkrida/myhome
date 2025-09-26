import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ServerSessionCleanup } from "@/lib/server-session-cleanup";

/**
 * Comprehensive logout API endpoint
 * Handles server-side session cleanup and cookie clearing
 * Designed to work reliably in production environments
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🚪 Logout API - Starting comprehensive logout process");

    const cookieStore = cookies();
    const cookieStoreInstance = await cookieStore;

    // Get all possible auth cookies
    const cookiesToClear = ServerSessionCleanup.getAllPossibleAuthCookies();

    // Clear cookies from server-side cookie store
    let clearedCount = 0;
    for (const cookieName of cookiesToClear) {
      try {
        cookieStoreInstance.delete(cookieName);
        clearedCount++;
        console.log(`🧹 Logout API - Cleared server cookie: ${cookieName}`);
      } catch (error) {
        console.log(`⚠️ Logout API - Could not clear server cookie: ${cookieName}`);
      }
    }

    console.log(`✅ Logout API - Cleared ${clearedCount} server-side cookies`);

    // Create response with comprehensive cookie clearing headers
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
      clearedCookies: clearedCount,
      timestamp: new Date().toISOString()
    });

    // Add Set-Cookie headers to clear cookies on client
    const cookieClearHeaders = ServerSessionCleanup.createCookieClearHeaders();
    Object.entries(cookieClearHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add additional production-specific cookie clearing
    const productionCookies = [
      "__Secure-next-auth.session-token",
      "__Secure-authjs.session-token",
      "__Secure-next-auth.csrf-token",
      "__Secure-authjs.csrf-token",
    ];

    productionCookies.forEach(cookieName => {
      // Clear for current domain
      response.headers.append('Set-Cookie', 
        `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`
      );
      
      // Clear for Vercel domain
      if (process.env.NEXTAUTH_URL?.includes('vercel.app')) {
        response.headers.append('Set-Cookie', 
          `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure; Domain=.vercel.app`
        );
      }
    });

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log("✅ Logout API - Logout completed successfully");

    return response;

  } catch (error) {
    console.error("❌ Logout API - Error during logout:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for logout status/health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: "logout",
    status: "ready",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
