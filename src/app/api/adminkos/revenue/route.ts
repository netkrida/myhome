/**
 * GET /api/adminkos/revenue
 * Get revenue chart data (12 months)
 * Tier 1: HTTP API Controller
 */

import { NextResponse } from "next/server";
import { AdminKosAPI } from "@/server/api/adminkos.api";

export async function GET() {
  try {
    const result = await AdminKosAPI.getRevenueChart();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in GET /api/adminkos/revenue:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

