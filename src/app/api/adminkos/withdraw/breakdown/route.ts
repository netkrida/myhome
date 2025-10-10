/**
 * Withdraw Balance Breakdown API Route
 * GET /api/adminkos/withdraw/breakdown - Get detailed balance breakdown
 * Tier 1: HTTP API Controller
 * 
 * Returns detailed list of payment and withdrawal entries
 */

import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { WithdrawAPI } from "@/server/api/withdraw.api";

/**
 * GET - Get detailed balance breakdown for current AdminKos
 */
export async function GET() {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get AdminKosProfile ID from User ID
    const profileId = userContext.profileId;
    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "AdminKos profile not found" },
        { status: 404 }
      );
    }

    const result = await WithdrawAPI.getBreakdown(profileId);

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
    console.error("Error in GET /api/adminkos/withdraw/breakdown:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

