/**
 * Payout API Routes for AdminKos
 * GET /api/adminkos/payouts - Get all payouts
 * POST /api/adminkos/payouts - Create new payout request
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { PayoutAPI } from "@/server/api/payout.api";
import { createPayoutSchema } from "@/server/schemas/bank-account.schema";

/**
 * GET - Get all payouts for current AdminKos
 */
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

    const result = await PayoutAPI.getByAdminKosId(profileId);

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
    console.error("Error in GET /api/adminkos/payouts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new payout request
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validationResult = createPayoutSchema.safeParse(body);

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

    const result = await PayoutAPI.create(profileId, validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Pengajuan penarikan dana berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/adminkos/payouts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

