import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Simplified route config
const ROLE_DASHBOARDS = {
  SUPERADMIN: "/dashboard/superadmin",
  ADMINKOS: "/dashboard/adminkos", 
  RECEPTIONIST: "/dashboard/receptionist",
  CUSTOMER: "/dashboard/customer"
} as const;

const PUBLIC_ROUTES = [
  "/", "/login", "/register", "/about", "/contact",
  "/search", "/properties", "/property", "/rooms", "/payment",
  "/api/auth", "/api/test-db", "/api/wilayah", "/api/properties/coordinates",
  "/api/public", "/api/analytics", "/api/debug", "/data"
];

// Webhook endpoints that should NOT require authentication
// These are called by external services (Midtrans, etc)
const WEBHOOK_ROUTES = [
  "/api/midtrans/notify",
  "/api/bookings/payment/webhook",
  "/api/payments/webhook"
];

// Cron endpoints that should NOT require NextAuth authentication
// These use their own Bearer token authentication (CRON_SECRET)
const CRON_ROUTES = [
  "/api/cron/cleanup-expired",
  "/api/cron/expire/bookings"
];

const ADMIN_ROLES = ["SUPERADMIN", "ADMINKOS", "RECEPTIONIST"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add debug logging for production
  console.log("🔍 Middleware - Processing:", {
    pathname,
    host: request.headers.get("host"),
    origin: request.nextUrl.origin,
    method: request.method
  });

  // Skip static files and auth routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Skip webhook routes - these are called by external services
  // Security is handled by signature verification in the endpoint
  if (WEBHOOK_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    console.log("🔓 Middleware - Webhook route, skipping auth:", pathname);

    // Add header to bypass ngrok warning page
    const response = NextResponse.next();
    response.headers.set('ngrok-skip-browser-warning', 'true');
    return response;
  }

  // Skip cron routes - these use Bearer token authentication (CRON_SECRET)
  // Security is handled by the route handler itself
  if (CRON_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    console.log("🔓 Middleware - Cron route, skipping NextAuth:", pathname);
    return NextResponse.next();
  }

  // Add ngrok bypass header for payment redirect pages
  // These pages are accessed after Midtrans redirect
  if (pathname.startsWith('/payment/')) {
    console.log("🔓 Middleware - Payment redirect page, adding ngrok bypass header:", pathname);
    const response = NextResponse.next();
    response.headers.set('ngrok-skip-browser-warning', 'true');

    // Continue with normal auth flow for payment pages
    // (will be handled below)
  }

  // Get token - try NextAuth v5 format first, then fallback to v4 format
  let token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token"
  });

  // Fallback to NextAuth v4 format if v5 format not found
  if (!token) {
    console.log("🔍 Middleware - NextAuth v5 token not found, trying v4 format");
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token"
    });
  }

  console.log("🔍 Middleware - Token:", {
    hasToken: !!token,
    role: token?.role,
    email: token?.email,
    cookies: request.cookies.getAll().map(c => c.name),
    authSecret: !!process.env.AUTH_SECRET,
    tokenSource: token ? "found" : "not_found"
  });

  const isPublic = PUBLIC_ROUTES.some(route => 
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );

  // Handle public routes
  if (isPublic) {
    // Don't redirect API endpoints even for authenticated users
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    if (token?.role && ADMIN_ROLES.includes(token.role as string)) {
      const dashboardUrl = ROLE_DASHBOARDS[token.role as keyof typeof ROLE_DASHBOARDS];
      console.log("🔄 Middleware - Redirecting authenticated user:", {
        from: pathname,
        to: dashboardUrl,
        role: token.role
      });
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return NextResponse.next();
  }

  // Require authentication for protected routes
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    console.log("🔄 Middleware - Redirecting to login:", {
      from: pathname,
      to: loginUrl.toString()
    });
    return NextResponse.redirect(loginUrl);
  }

  // Handle dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const userRole = token.role as string;

    console.log("🏠 Middleware - Dashboard access:", {
      pathname,
      userRole,
      availableRoles: Object.keys(ROLE_DASHBOARDS)
    });

    // Redirect /dashboard to role-specific dashboard
    if (pathname === "/dashboard") {
      const dashboardUrl = ROLE_DASHBOARDS[userRole as keyof typeof ROLE_DASHBOARDS] || "/";
      console.log("🔄 Middleware - Redirecting to role dashboard:", {
        from: pathname,
        to: dashboardUrl,
        role: userRole
      });
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Simple role-based access check
    const allowedDashboard = ROLE_DASHBOARDS[userRole as keyof typeof ROLE_DASHBOARDS];

    // Special logging for property detail pages
    if (pathname.includes("/properties/")) {
      console.log("🏠 Middleware - Property detail access:", {
        pathname,
        userRole,
        allowedDashboard,
        startsWithAllowed: pathname.startsWith(allowedDashboard || ""),
        willRedirect: allowedDashboard && !pathname.startsWith(allowedDashboard)
      });
    }

    if (allowedDashboard && !pathname.startsWith(allowedDashboard)) {
      console.log("🔄 Middleware - Role mismatch, redirecting:", {
        from: pathname,
        to: allowedDashboard,
        role: userRole
      });
      return NextResponse.redirect(new URL(allowedDashboard, request.url));
    }
  }

  // Handle API routes with basic role check
  if (pathname.startsWith("/api/")) {
    const userRole = token.role as string;

    // Simple API access control
    if (pathname.startsWith("/api/users") && !["SUPERADMIN", "ADMINKOS"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (pathname.startsWith("/api/properties") && !["SUPERADMIN", "ADMINKOS"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Analytics API - only SUPERADMIN can access (except /api/analytics/track which is public)
    if (pathname.startsWith("/api/analytics") && !pathname.startsWith("/api/analytics/track")) {
      if (userRole !== "SUPERADMIN") {
        console.log("🔒 Middleware - Analytics access denied:", {
          pathname,
          userRole,
          required: "SUPERADMIN"
        });
        return NextResponse.json({ error: "Forbidden - SUPERADMIN access required" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};