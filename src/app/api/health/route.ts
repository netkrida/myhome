import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: "OK",
    database: "UNKNOWN",
    auth_secret: "UNKNOWN",
    nextauth_url: "UNKNOWN",
    api_routes: {
      auth_providers: "UNKNOWN",
      auth_signin: "UNKNOWN",
      auth_callback: "UNKNOWN"
    }
  };

  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "OK";
    } catch (dbError) {
      checks.database = `ERROR: ${dbError instanceof Error ? dbError.message : 'Unknown DB error'}`;
    }

    // Check AUTH_SECRET
    checks.auth_secret = process.env.AUTH_SECRET ? "OK" : "MISSING";

    // Check NEXTAUTH_URL (important for production)
    checks.nextauth_url = process.env.NEXTAUTH_URL ? "OK" : "MISSING";

    // Test auth endpoints
    const baseUrl = request.nextUrl.origin;
    
    try {
      const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
      checks.api_routes.auth_providers = providersResponse.ok ? "OK" : `ERROR: ${providersResponse.status}`;
    } catch {
      checks.api_routes.auth_providers = "ERROR: Cannot reach endpoint";
    }

    try {
      const signinResponse = await fetch(`${baseUrl}/api/auth/signin`);
      checks.api_routes.auth_signin = signinResponse.ok ? "OK" : `ERROR: ${signinResponse.status}`;
    } catch {
      checks.api_routes.auth_signin = "ERROR: Cannot reach endpoint";
    }

    try {
      const callbackResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`);
      checks.api_routes.auth_callback = callbackResponse.ok ? "OK" : `ERROR: ${callbackResponse.status}`;
    } catch {
      checks.api_routes.auth_callback = "ERROR: Cannot reach endpoint";
    }

  } catch (error) {
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : 'Unknown error',
      checks
    }, { status: 500 });
  }

  const hasErrors = Object.values(checks).some(value => 
    typeof value === 'string' && (value.includes('ERROR') || value.includes('MISSING'))
  ) || Object.values(checks.api_routes).some(value => 
    value.includes('ERROR')
  );

  return NextResponse.json({
    status: hasErrors ? "DEGRADED" : "OK",
    checks
  }, { 
    status: hasErrors ? 206 : 200 
  });
}
