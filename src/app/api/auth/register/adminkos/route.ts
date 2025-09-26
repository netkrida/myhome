import { NextRequest, NextResponse } from "next/server";
import { AdminKosRegistrationAPI } from "@/server/api/adminkos-registration.api";

/**
 * POST /api/auth/register/adminkos
 * Register a new AdminKos user
 * Tier 1: HTTP API controllers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await AdminKosRegistrationAPI.registerAdminKos(body);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          details: result.details 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Akun AdminKos berhasil didaftarkan",
      data: {
        user: {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role,
          address: result.data.user.address,
          createdAt: result.data.user.createdAt,
        },
        profile: result.data.profile,
      },
    });
  } catch (error) {
    console.error("Error in AdminKos registration route:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Terjadi kesalahan server" 
      },
      { status: 500 }
    );
  }
}
