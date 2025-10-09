/**
 * GET /api/superadmin/transactions/export
 * Export transactions to CSV
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { SuperadminTransactionsAPI } from "@/server/api/superadmin.transactions";
import type { TransactionFilters } from "@/server/types/transaction.types";
import { format } from "date-fns";

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

    // Get export format (default: csv)
    const exportFormat = searchParams.get("format") || "csv";

    // Export transactions
    const result = await SuperadminTransactionsAPI.exportTransactions(
      filters,
      exportFormat as "csv" | "excel"
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    const { data, filename, mimeType } = result.data!;

    // Return file as download
    // Convert Buffer to Uint8Array if needed
    const responseData = typeof data === 'string' ? data : new Uint8Array(data);

    return new NextResponse(responseData, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/superadmin/transactions/export:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

