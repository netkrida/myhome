import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { UserRepository } from "@/server/repositories/user.repository";

/**
 * Validate current session against database
 * Returns session status and user information
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Validate Session API - Checking session validity");

    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log("❌ Validate Session API - No session found");
      return NextResponse.json({
        valid: false,
        reason: "No session found",
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    console.log("🔍 Validate Session API - Session found, validating user:", {
      userId: session.user.id,
      sessionRole: session.user.role
    });

    // Check if user exists in database
    const dbUser = await UserRepository.findById(session.user.id);
    
    if (!dbUser) {
      console.log("❌ Validate Session API - User not found in database:", {
        userId: session.user.id
      });
      
      return NextResponse.json({
        valid: false,
        reason: "User not found in database",
        userId: session.user.id,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    if (!dbUser.isActive) {
      console.log("❌ Validate Session API - User is inactive:", {
        userId: session.user.id,
        isActive: dbUser.isActive
      });
      
      return NextResponse.json({
        valid: false,
        reason: "User account is inactive",
        userId: session.user.id,
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Check if role matches
    if (dbUser.role !== session.user.role) {
      console.log("⚠️ Validate Session API - Role mismatch:", {
        userId: session.user.id,
        sessionRole: session.user.role,
        dbRole: dbUser.role
      });
      
      return NextResponse.json({
        valid: false,
        reason: "Role mismatch - session needs refresh",
        userId: session.user.id,
        sessionRole: session.user.role,
        currentRole: dbUser.role,
        timestamp: new Date().toISOString()
      }, { status:409 });
    }

    console.log("✅ Validate Session API - Session is valid:", {
      userId: dbUser.id,
      role: dbUser.role,
      email: dbUser.email
    });

    return NextResponse.json({
      valid: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        isActive: dbUser.isActive
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Validate Session API - Error:", error);

    return NextResponse.json({
      valid: false,
      reason: "Internal server error during validation",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Force session validation and cleanup if invalid
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Validate Session API - Force validation requested");

    // First validate the session
    const validateResponse = await GET(request);
    const validateData = await validateResponse.json();

    if (validateData.valid) {
      console.log("✅ Validate Session API - Session is valid, no cleanup needed");
      return NextResponse.json({
        action: "validated",
        valid: true,
        user: validateData.user,
        timestamp: new Date().toISOString()
      });
    }

    console.log("🧹 Validate Session API - Session invalid, triggering cleanup");

    // If session is invalid, trigger cleanup
    const cleanupResponse = await fetch(new URL('/api/auth/clear-session', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const cleanupData = await cleanupResponse.json();

    return NextResponse.json({
      action: "cleaned",
      valid: false,
      reason: validateData.reason,
      cleanup: cleanupData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Validate Session API - Error in force validation:", error);

    return NextResponse.json({
      action: "error",
      valid: false,
      reason: "Error during force validation",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
