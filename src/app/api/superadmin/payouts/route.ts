/**
 * Payout API Routes for Superadmin
 * GET /api/superadmin/payouts - Get all payout submissions
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { PayoutAPI } from "@/server/api/payout.api";
import { payoutQuerySchema } from "@/server/schemas/bank-account.schema";

export async function GET(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validationResult = payoutQuerySchema.safeParse(queryParams);

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

    const result = await PayoutAPI.getAll(validationResult.data);

    // fix: discriminated union Result type - guard before accessing error
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data.payouts,
      pagination: {
        page: validationResult.data.page,
        limit: validationResult.data.limit,
        total: result.data.total,
        totalPages: Math.ceil(result.data.total / validationResult.data.limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/superadmin/payouts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

