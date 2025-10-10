/**
 * Withdraw Summary API Route
 * GET /api/adminkos/withdraw/summary - Get withdrawable balance summary
 * Tier 1: HTTP API Controller
 * 
 * Returns balance that can be withdrawn from "Pembayaran Kos" account only
 */

import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { WithdrawAPI } from "@/server/api/withdraw.api";

/**
 * GET - Get withdrawable balance summary for current AdminKos
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

    const result = await WithdrawAPI.getSummary(profileId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    // Normalize data for client consumption (ensure numbers and ISO string)
    const summary = result.data;
    return NextResponse.json({
      success: true,
      data: {
        totalPaymentIncome: Number(summary.totalPaymentIncome ?? 0),
        totalWithdrawals: Number(summary.totalWithdrawals ?? 0),
        withdrawableBalance: Number(summary.withdrawableBalance ?? 0),
        pendingWithdrawals: Number(summary.pendingWithdrawals ?? 0),
        availableBalance: Number(summary.availableBalance ?? 0),
        asOf: summary.asOf.toISOString(), // Convert Date to ISO string
        pembayaranKosAccountId: summary.pembayaranKosAccountId,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/adminkos/withdraw/summary:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

