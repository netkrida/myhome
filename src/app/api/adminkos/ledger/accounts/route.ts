/**
 * AdminKos Ledger Accounts API
 * GET /api/adminkos/ledger/accounts - List accounts
 * POST /api/adminkos/ledger/accounts - Create account
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";
import { z } from "zod";

const listAccountsQuerySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "OTHER"]).nullable().optional(),
  includeArchived: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
});

const createAccountSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  type: z.enum(["INCOME", "EXPENSE", "OTHER"], { required_error: "Type is required" }),
  code: z.string().min(2, "Code must be at least 2 characters").max(30, "Code cannot exceed 30 characters").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryResult = listAccountsQuerySchema.safeParse({
      type: searchParams.get("type"),
      includeArchived: searchParams.get("includeArchived"),
      search: searchParams.get("search"),
    });

    if (!queryResult.success) {
      console.error("GET /api/adminkos/ledger/accounts validation error:", queryResult.error.errors);
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const query = {
      type: queryResult.data.type || undefined,
      search: queryResult.data.search || undefined,
      includeArchived: queryResult.data.includeArchived === "true",
    };

    // Call application service
    const result = await AdminKosLedgerAPI.listAccounts(query);

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
    console.error("Error in list ledger accounts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("POST /api/adminkos/ledger/accounts - Request body:", body);

    // Parse and validate request body
    const validationResult = createAccountSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("POST /api/adminkos/ledger/accounts validation error:", validationResult.error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Call application service
    const result = await AdminKosLedgerAPI.createAccount(data);

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
    console.error("Error in create ledger account API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
