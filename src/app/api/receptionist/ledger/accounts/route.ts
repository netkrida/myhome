import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { ReceptionistRepository } from "@/server/repositories/adminkos/receptionist.repository";
import { LedgerRepository } from "@/server/repositories/global/ledger.repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== UserRole.RECEPTIONIST) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const profileResult = await ReceptionistRepository.findProfileByUserId(user.id);
    if (!profileResult.success) {
      return NextResponse.json(
        { success: false, error: profileResult.error.message, code: profileResult.error.code },
        { status: profileResult.statusCode }
      );
    }

    const { propertyId, adminKosId } = profileResult.data;
    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "Receptionist is not assigned to any property" },
        { status: 404 }
      );
    }

    if (!adminKosId) {
      return NextResponse.json(
        { success: false, error: "AdminKos profile for this property is not configured" },
        { status: 409 }
      );
    }

    const accounts = await LedgerRepository.getAccountsByAdminKos(adminKosId, { type: "INCOME" });
    const activeAccounts = accounts.filter((account) => !account.isArchived);

    return NextResponse.json({
      success: true,
      data: activeAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        code: account.code ?? undefined,
        isSystem: account.isSystem,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/receptionist/ledger/accounts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
