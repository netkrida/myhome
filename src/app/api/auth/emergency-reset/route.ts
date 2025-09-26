import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ServerSessionCleanup } from "@/lib/server-session-cleanup";

/**
 * Emergency session reset endpoint
 * This is a nuclear option that clears ALL authentication data
 * Use only when normal session cleanup fails
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🚨 Emergency Reset API - Starting emergency session reset");

    const cookieStore = cookies();

    // Get all possible auth-related cookie names
    const allPossibleCookies = ServerSessionCleanup.getAllPossibleAuthCookies();

    // Clear server-side cookies
    let serverClearedCount = 0;
    const cookieStoreInstance = await cookieStore;
    for (const cookieName of allPossibleCookies) {
      try {
        cookieStoreInstance.delete(cookieName);
        serverClearedCount++;
        console.log(`🧹 Emergency Reset - Cleared server cookie: ${cookieName}`);
      } catch (error) {
        // Ignore errors for cookies that don't exist
      }
    }

    console.log(`✅ Emergency Reset - Cleared ${serverClearedCount} server-side cookies`);

    // Create response with comprehensive cookie clearing headers
    const response = NextResponse.json({
      success: true,
      message: "Emergency session reset completed",
      clearedServerCookies: serverClearedCount,
      timestamp: new Date().toISOString(),
      instructions: [
        "All server-side authentication cookies have been cleared",
        "Client-side cookies will be cleared via response headers",
        "Browser storage should be cleared by the client",
        "Page refresh is recommended after this operation"
      ]
    });

    // Set comprehensive cookie clearing headers for client-side cleanup
    allPossibleCookies.forEach(cookieName => {
      // Clear for root path
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Clear for /api path
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/api',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Clear for /auth path
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/auth',
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
      
      // Clear with domain variations
      if (process.env.NODE_ENV === 'production') {
        // In production, also try to clear with domain
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
          domain: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : undefined,
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        });
      }
    });

    // Add comprehensive cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    console.log("✅ Emergency Reset API - Emergency session reset completed successfully");

    return response;

  } catch (error) {
    console.error("❌ Emergency Reset API - Error during emergency reset:", error);

    // Even if there's an error, try to return a response that clears cookies
    const errorResponse = NextResponse.json({
      success: false,
      message: "Emergency session reset encountered errors but attempted cleanup",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });

    // Still try to clear basic auth cookies
    const basicCookies = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "authjs.session-token",
      "__Secure-authjs.session-token"
    ];

    basicCookies.forEach(cookieName => {
      errorResponse.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return errorResponse;
  }
}

/**
 * Get emergency reset status and available options
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Emergency Reset API - Getting reset status");

    const cookieStore = cookies();
    const allCookies = (await cookieStore).getAll();
    
    // Filter for auth-related cookies
    const authCookies = allCookies.filter(cookie => {
      const name = cookie.name.toLowerCase();
      return name.includes('auth') || 
             name.includes('session') || 
             name.includes('token') || 
             name.includes('csrf') ||
             name.includes('oauth');
    });

    return NextResponse.json({
      status: "ready",
      message: "Emergency reset is available",
      currentAuthCookies: authCookies.map(c => c.name),
      authCookieCount: authCookies.length,
      timestamp: new Date().toISOString(),
      warning: "Emergency reset will clear ALL authentication data. Use only if normal logout fails."
    });

  } catch (error) {
    console.error("❌ Emergency Reset API - Error getting status:", error);

    return NextResponse.json({
      status: "error",
      message: "Error checking emergency reset status",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
