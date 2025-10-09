/**
 * GET /api/superadmin/transactions/[id]
 * Get transaction detail by ID
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { SuperadminTransactionsAPI } from "@/server/api/superadmin.transactions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Get transaction detail
    const result = await SuperadminTransactionsAPI.getTransactionDetail(id);

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
    console.error("Error in GET /api/superadmin/transactions/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

