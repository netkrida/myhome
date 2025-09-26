import { NextRequest, NextResponse } from "next/server";
import { AdminKosRegistrationAPI } from "@/server/api/adminkos-registration.api";

/**
 * GET /api/auth/check-email?email=example@email.com
 * Check if email is available for registration
 * Tier 1: HTTP API controllers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Email parameter is required" 
        },
        { status: 400 }
      );
    }

    const result = await AdminKosRegistrationAPI.checkEmailAvailability(email);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      available: result.data,
      message: result.data ? "Email tersedia" : "Email sudah terdaftar",
    });
  } catch (error) {
    console.error("Error checking email availability:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Terjadi kesalahan server" 
      },
      { status: 500 }
    );
  }
}
