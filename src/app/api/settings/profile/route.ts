/**
 * Profile API Routes
 * GET /api/settings/profile - Get current user profile
 * PATCH /api/settings/profile - Update current user profile
 * Tier 1: HTTP API Controller
 */

import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { getMyProfile, updateMyProfile } from "@/server/api/settings/profile.service";

/**
 * GET - Get current user profile
 */
export async function GET() {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await getMyProfile(userContext.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in GET /api/settings/profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update current user profile
 */
export async function PATCH(req: Request) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updatedUser = await updateMyProfile(userContext.id, body);

    // Remove sensitive data
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: "Profil berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/settings/profile:", error);
    
    // Handle validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Data tidak valid", details: error.errors },
        { status: 400 }
      );
    }

    // Handle business logic errors
    if (error.message) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

