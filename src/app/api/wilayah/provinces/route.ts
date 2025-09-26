import { NextResponse } from "next/server";
import { WilayahService } from "@/server/services/wilayah.service";

/**
 * GET /api/wilayah/provinces
 * Get all provinces
 * Tier 1: HTTP API controllers
 */
export async function GET() {
  try {
    const result = await WilayahService.getProvinces();

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
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Terjadi kesalahan server" 
      },
      { status: 500 }
    );
  }
}
