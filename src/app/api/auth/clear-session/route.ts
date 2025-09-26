import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ServerSessionCleanup } from "@/lib/server-session-cleanup";

/**
 * Clear invalid session when user not found in database
 * This API provides comprehensive session cleanup including:
 * - NextAuth cookies
 * - CSRF tokens
 * - Callback URLs
 * - Legacy auth cookies
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Clear Session API - Clearing invalid session");

    const cookieStore = cookies();

    // Get comprehensive list of all possible auth cookies
    const cookiesToClear = ServerSessionCleanup.getAllPossibleAuthCookies();

    // Clear cookies from server-side cookie store
    let clearedCount = 0;
    const cookieStoreInstance = await cookieStore;
    for (const cookieName of cookiesToClear) {
      try {
        cookieStoreInstance.delete(cookieName);
        clearedCount++;
        console.log(`🧹 Cleared server cookie: ${cookieName}`);
      } catch (error) {
        console.log(`⚠️ Could not clear server cookie: ${cookieName}`);
      }
    }

    console.log(`✅ Clear Session API - Cleared ${clearedCount} server-side cookies`);

    // Create response with comprehensive cookie clearing headers
    const response = NextResponse.json({
      success: true,
      message: "Session cleared",
      clearedCookies: clearedCount,
      timestamp: new Date().toISOString()
    });

    // Set cookie clearing headers for client-side cleanup
    cookiesToClear.forEach(cookieName => {
      // Clear for root path
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Also clear for any subdirectories
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/api',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Clear non-httpOnly version for client-side cookies
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log("✅ Clear Session API - Session cleared successfully with comprehensive cleanup");

    return response;

  } catch (error) {
    console.error("❌ Clear Session API - Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear session"
      },
      { status: 500 }
    );
  }
}
