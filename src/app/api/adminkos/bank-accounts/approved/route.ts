/**
 * GET /api/adminkos/bank-accounts/approved
 * Get approved bank account for current AdminKos
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { BankAccountAPI } from "@/server/api/bank-account.api";

export async function GET(request: NextRequest) {
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

    const result = await BankAccountAPI.getApprovedByAdminKosId(profileId);

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
    console.error("Error in GET /api/adminkos/bank-accounts/approved:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

