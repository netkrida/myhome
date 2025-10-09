/**
 * AdminKos Ledger Sync API
 * POST /api/adminkos/ledger/sync - Initialize or fix ledger synchronization
 * GET /api/adminkos/ledger/sync - Get sync status
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { LedgerSyncUtils } from "@/server/api/hooks/ledger-sync.utils";
import { z } from "zod";

const syncActionSchema = z.object({
  action: z.enum(["initialize", "validate", "fix"], { required_error: "Action is required" }),
});

export async function GET(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();

    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const adminKosId = userContext.profileId;
    if (!adminKosId) {
      return NextResponse.json(
        { error: "AdminKos profile not found" },
        { status: 404 }
      );
    }

    // Get sync status
    const status = await LedgerSyncUtils.getSyncStatus(adminKosId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error in ledger sync status API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();

    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const adminKosId = userContext.profileId;
    if (!adminKosId) {
      return NextResponse.json(
        { error: "AdminKos profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Parse and validate request body
    const validationResult = syncActionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { action } = validationResult.data;

    let result;

    switch (action) {
      case "initialize":
        result = await LedgerSyncUtils.initializeLedgerForAdminKos(adminKosId);
        break;

      case "validate":
        result = await LedgerSyncUtils.validateLedgerIntegrity(adminKosId);
        break;

      case "fix":
        result = await LedgerSyncUtils.fixMissingEntries(adminKosId);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in ledger sync API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
