/**
 * AdminKos Ledger Balance API
 * GET /api/adminkos/ledger/balance - Get balance info for withdraw integration
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";

export async function GET(request: NextRequest) {
  try {
    // Call application service
    const result = await AdminKosLedgerAPI.getBalanceInfo();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.message === "Access denied" ? 403 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in ledger balance API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
