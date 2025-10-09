/**
 * AdminKos Ledger Account Management API
 * PATCH /api/adminkos/ledger/accounts/[id] - Archive/Unarchive account
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";
import { z } from "zod";

const updateAccountSchema = z.object({
  action: z.enum(["archive", "unarchive"], { required_error: "Action is required" }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const accountId = resolvedParams.id;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Parse and validate request body
    const validationResult = updateAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { action } = validationResult.data;

    // Call appropriate application service method
    const result = action === "archive" 
      ? await AdminKosLedgerAPI.archiveAccount(accountId)
      : await AdminKosLedgerAPI.unarchiveAccount(accountId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.message === "Access denied" ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in update ledger account API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
