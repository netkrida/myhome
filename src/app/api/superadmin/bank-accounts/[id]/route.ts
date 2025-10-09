/**
 * Bank Account detail/update/delete routes for Superadmin
 * GET /api/superadmin/bank-accounts/[id]
 * PUT /api/superadmin/bank-accounts/[id]
 * DELETE /api/superadmin/bank-accounts/[id]
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { BankAccountAPI } from "@/server/api/bank-account.api";
import { updateBankAccountSchema } from "@/server/schemas/bank-account.schema";

async function authorizeSuperadmin() {
  const userContext = await getCurrentUserContext();
  if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await authorizeSuperadmin();
    if (unauthorized) {
      return unauthorized;
    }

    const { id } = await context.params;

    const result = await BankAccountAPI.getById(id);

    // fix: discriminated union Result type - guard before accessing error
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message || "Rekening bank tidak ditemukan" },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in GET /api/superadmin/bank-accounts/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await authorizeSuperadmin();
    if (unauthorized) {
      return unauthorized;
    }

    const body = await request.json();
    const validationResult = updateBankAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

  const { id } = await context.params;

  const result = await BankAccountAPI.update(id, validationResult.data);

    // fix: discriminated union Result type - guard before accessing error
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message || "Gagal memperbarui rekening bank" },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in PUT /api/superadmin/bank-accounts/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await authorizeSuperadmin();
    if (unauthorized) {
      return unauthorized;
    }

    const { id } = await context.params;

    const result = await BankAccountAPI.delete(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message ?? "Gagal menghapus rekening bank" },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/superadmin/bank-accounts/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
