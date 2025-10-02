import { NextResponse } from "next/server";

import { CampusAPI } from "@/server/api/campus.api";

export async function GET() {
  try {
    console.log("🔍 GET /api/public/campuses - Fetching campus list");

    const result = await CampusAPI.listCampuses();

    if (!result.success) {
      console.error("❌ GET /api/public/campuses - Failed:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.statusCode ?? 502 }
      );
    }

    console.log("✅ GET /api/public/campuses - Success:", {
      count: result.data?.length ?? 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("❌ GET /api/public/campuses - Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Terjadi kesalahan server",
        },
      },
      { status: 500 }
    );
  }
}
