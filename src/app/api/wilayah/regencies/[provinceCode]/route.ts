import { NextRequest, NextResponse } from "next/server";
import { WilayahService } from "@/server/services/wilayah.service";

/**
 * GET /api/wilayah/regencies/[provinceCode]
 * Get regencies by province code
 * Tier 1: HTTP API controllers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provinceCode: string } }
) {
  try {
    const { provinceCode } = params;

    if (!provinceCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Kode provinsi diperlukan" 
        },
        { status: 400 }
      );
    }

    const result = await WilayahService.getRegencies(provinceCode);

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
    console.error("Error fetching regencies:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Terjadi kesalahan server" 
      },
      { status: 500 }
    );
  }
}
