/**
 * GET /api/superadmin/transactions/chart
 * Get chart data (time series + method breakdown)
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { SuperadminTransactionsAPI } from "@/server/api/superadmin.transactions";
import type { TransactionFilters } from "@/server/types/transaction.types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query params
    const filters: TransactionFilters = {};

    if (searchParams.get("dateFrom")) {
      filters.dateFrom = new Date(searchParams.get("dateFrom")!);
    }

    if (searchParams.get("dateTo")) {
      filters.dateTo = new Date(searchParams.get("dateTo")!);
    }

    if (searchParams.get("status")) {
      filters.status = searchParams.get("status")!;
    }

    if (searchParams.get("paymentType")) {
      filters.paymentType = searchParams.get("paymentType")!;
    }

    if (searchParams.get("paymentMethod")) {
      filters.paymentMethod = searchParams.get("paymentMethod")!;
    }

    if (searchParams.get("propertyId")) {
      filters.propertyId = searchParams.get("propertyId")!;
    }

    if (searchParams.get("ownerId")) {
      filters.ownerId = searchParams.get("ownerId")!;
    }

    if (searchParams.get("search")) {
      filters.search = searchParams.get("search")!;
    }

    // Get granularity (default: day)
    const granularity = (searchParams.get("granularity") || "day") as "day" | "week" | "month";

    // Get chart data
    const result = await SuperadminTransactionsAPI.getChartData(filters, granularity);

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
    console.error("Error in GET /api/superadmin/transactions/chart:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

