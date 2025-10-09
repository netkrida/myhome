/**
 * AdminKos Ledger Summary API
 * GET /api/adminkos/ledger/summary
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";
import { z } from "zod";

const summaryQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = summaryQuerySchema.safeParse({
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo } = queryResult.data;

    // Default to current month if no dates provided
    const now = new Date();
    const defaultDateFrom = dateFrom 
      ? new Date(dateFrom) 
      : new Date(now.getFullYear(), now.getMonth(), 1);
    
    const defaultDateTo = dateTo 
      ? new Date(dateTo) 
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Validate date range
    if (defaultDateFrom > defaultDateTo) {
      return NextResponse.json(
        { error: "dateFrom cannot be later than dateTo" },
        { status: 400 }
      );
    }

    // Call application service
    const result = await AdminKosLedgerAPI.getSummary(defaultDateFrom, defaultDateTo);

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
    console.error("Error in ledger summary API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
