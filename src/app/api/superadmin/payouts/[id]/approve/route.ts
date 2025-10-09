/**
 * POST /api/superadmin/payouts/[id]/approve
 * Approve or reject payout submission
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { PayoutAPI } from "@/server/api/payout.api";
import { approvePayoutSchema } from "@/server/schemas/bank-account.schema";

export async function POST(
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
    const body = await request.json();
    
    const validationResult = approvePayoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const result = await PayoutAPI.processApproval(
      id,
      validationResult.data,
      userContext.id
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: validationResult.data.approved
        ? "Penarikan dana berhasil disetujui"
        : "Penarikan dana ditolak",
    });
  } catch (error) {
    console.error("Error in POST /api/superadmin/payouts/[id]/approve:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

