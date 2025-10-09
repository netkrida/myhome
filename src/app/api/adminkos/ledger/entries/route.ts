/**
 * AdminKos Ledger Entries API
 * GET /api/adminkos/ledger/entries - List entries
 * POST /api/adminkos/ledger/entries - Create manual entry
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";
import { z } from "zod";

const listEntriesQuerySchema = z.object({
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
  propertyId: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  direction: z.enum(["IN", "OUT"]).nullable().optional(),
  refType: z.enum(["PAYMENT", "PAYOUT", "MANUAL", "ADJUSTMENT"]).nullable().optional(),
  search: z.string().nullable().optional(),
  page: z.string().nullable().optional(),
  limit: z.string().nullable().optional(),
  sortBy: z.enum(["date", "amount", "createdAt"]).nullable().optional(),
  sortOrder: z.enum(["asc", "desc"]).nullable().optional(),
});

const createEntrySchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  direction: z.enum(["IN", "OUT"], { required_error: "Direction is required" }),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().optional(),
  note: z.string().optional(),
  propertyId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryParams = {
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      propertyId: searchParams.get("propertyId"),
      accountId: searchParams.get("accountId"),
      direction: searchParams.get("direction"),
      refType: searchParams.get("refType"),
      search: searchParams.get("search"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    };

    console.log("GET /api/adminkos/ledger/entries - Query params:", queryParams);

    // Parse and validate query parameters
    const queryResult = listEntriesQuerySchema.safeParse(queryParams);

    if (!queryResult.success) {
      console.error("GET /api/adminkos/ledger/entries validation error:", queryResult.error.errors);
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const query: any = {
      dateFrom: queryResult.data.dateFrom || undefined,
      dateTo: queryResult.data.dateTo || undefined,
      propertyId: queryResult.data.propertyId || undefined,
      accountId: queryResult.data.accountId || undefined,
      direction: queryResult.data.direction || undefined,
      refType: queryResult.data.refType || undefined,
      search: queryResult.data.search || undefined,
      page: queryResult.data.page ? parseInt(queryResult.data.page) : 1,
      limit: queryResult.data.limit ? parseInt(queryResult.data.limit) : 20,
      sortBy: queryResult.data.sortBy || "date",
      sortOrder: queryResult.data.sortOrder || "desc",
    };

    // Parse dates if provided
    if (query.dateFrom) {
      const parsedDate = new Date(query.dateFrom);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid dateFrom format. Use YYYY-MM-DD format." },
          { status: 400 }
        );
      }
      query.dateFrom = parsedDate;
    }

    if (query.dateTo) {
      const parsedDate = new Date(query.dateTo);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid dateTo format. Use YYYY-MM-DD format." },
          { status: 400 }
        );
      }
      query.dateTo = parsedDate;
    }

    // Validate date range
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      return NextResponse.json(
        { error: "dateFrom cannot be later than dateTo" },
        { status: 400 }
      );
    }

    // Validate pagination
    if (query.page < 1) {
      return NextResponse.json(
        { error: "Page must be greater than 0" },
        { status: 400 }
      );
    }

    if (query.limit < 1 || query.limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Call application service
    const result = await AdminKosLedgerAPI.listEntries(query);

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
    console.error("Error in list ledger entries API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse and validate request body
    const validationResult = createEntrySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Parse date if provided
    let entryData: any = { ...data, refType: "MANUAL" };
    if (data.date) {
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Use YYYY-MM-DD format." },
          { status: 400 }
        );
      }
      entryData.date = parsedDate;
    }

    // Call application service
    const result = await AdminKosLedgerAPI.createManualEntry(entryData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.message === "Access denied" ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in create ledger entry API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
