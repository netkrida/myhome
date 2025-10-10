/**
 * Password API Routes
 * POST /api/settings/password - Change user password
 * Tier 1: HTTP API Controller
 */

import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { changeMyPassword } from "@/server/api/settings/password.service";

/**
 * POST - Change user password
 */
export async function POST(req: Request) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    await changeMyPassword(userContext.id, body);

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error: any) {
    console.error("Error in POST /api/settings/password:", error);
    
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

