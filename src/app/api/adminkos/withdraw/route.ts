/**
 * Withdraw API Routes for AdminKos
 * POST /api/adminkos/withdraw - Create new withdraw request
 * Tier 1: HTTP API Controller
 * 
 * Creates payout request with balance locked to "Pembayaran Kos" account
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { WithdrawAPI } from "@/server/api/withdraw.api";
import { z } from "zod";

const createWithdrawSchema = z.object({
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  bankAccountId: z.string().min(1, "Bank account ID is required"),
  notes: z.string().optional(),
});

/**
 * POST - Create new withdraw request
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

    // Parse and validate request body
    const body = await request.json();
    const validation = createWithdrawSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create withdraw request
    const result = await WithdrawAPI.createWithdrawRequest(profileId, data);

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
    console.error("Error in POST /api/adminkos/withdraw:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

