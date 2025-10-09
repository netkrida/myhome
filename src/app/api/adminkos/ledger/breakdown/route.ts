/**
 * AdminKos Ledger Breakdown API
 * GET /api/adminkos/ledger/breakdown
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";
import { z } from "zod";

const breakdownQuerySchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = breakdownQuerySchema.safeParse({
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

    const parsedDateFrom = new Date(dateFrom);
    const parsedDateTo = new Date(dateTo);

    // Validate dates
    if (isNaN(parsedDateFrom.getTime()) || isNaN(parsedDateTo.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    if (parsedDateFrom > parsedDateTo) {
      return NextResponse.json(
        { error: "dateFrom cannot be later than dateTo" },
        { status: 400 }
      );
    }

    // Call application service
    const result = await AdminKosLedgerAPI.getBreakdown(parsedDateFrom, parsedDateTo);

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
    console.error("Error in ledger breakdown API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
