/**
 * GET /api/banks
 * Get list of banks from Kemenkeu API
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { KemenkeuBankAdapter } from "@/server/adapters/kemenkeu/bank-api.adapter";

export async function GET(request: NextRequest) {
  try {
    const result = await KemenkeuBankAdapter.getBankList();

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
    console.error("Error in GET /api/banks:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

