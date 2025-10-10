/**
 * GET /api/superadmin/transactions/list
 * Get paginated transaction list
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { SuperadminTransactionsAPI } from "@/server/api/superadmin.transactions";
import type { TransactionFilters } from "@/server/types/transaction.types";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [Transactions List API] Request received");

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

    // Parse pagination params
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "25"), 200);

    // Parse sorting params
    const sortBy = searchParams.get("sortBy") || "transactionTime";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    console.log("🔍 [Transactions List API] Filters:", {
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    });

    // Get transaction list
    const result = await SuperadminTransactionsAPI.getTransactionList(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    console.log("🔍 [Transactions List API] Result:", {
      success: result.success,
      dataCount: result.success && result.data ? result.data.transactions.length : 0,
      total: result.success && result.data ? result.data.pagination.total : 0
    });

    if (!result.success) {
      console.error("❌ [Transactions List API] Error:", result.error);
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
    console.error("❌ [Transactions List API] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

