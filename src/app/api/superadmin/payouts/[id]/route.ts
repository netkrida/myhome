/**
 * GET /api/superadmin/payouts/[id]
 * Get payout detail by ID
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { PayoutAPI } from "@/server/api/payout.api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await PayoutAPI.getById(id);

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
    console.error("Error in GET /api/superadmin/payouts/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

