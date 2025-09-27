import { NextRequest, NextResponse } from "next/server";
import { WilayahService } from "@/server/services/wilayah.service";

/**
 * GET /api/wilayah/districts/[regencyCode]
 * Get districts by regency code
 * Tier 1: HTTP API controllers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ regencyCode: string }> }
) {
  try {
    const resolvedParams = await params;
    const { regencyCode } = resolvedParams;

    if (!regencyCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Kode kabupaten/kota diperlukan" 
        },
        { status: 400 }
      );
    }

    const result = await WilayahService.getDistricts(regencyCode);

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
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Terjadi kesalahan server" 
      },
      { status: 500 }
    );
  }
}
