/**
 * AdminKos Ledger Entry Detail API
 * PATCH /api/adminkos/ledger/entries/[id] - Update entry
 * DELETE /api/adminkos/ledger/entries/[id] - Delete entry
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";
import { z } from "zod";

const updateEntrySchema = z.object({
  accountId: z.string().optional(),
  direction: z.enum(["IN", "OUT"]).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    console.log("PATCH /api/adminkos/ledger/entries/[id] - Request body:", body);

    // Parse and validate request body
    const validationResult = updateEntrySchema.safeParse(body);

    if (!validationResult.success) {
      console.error("PATCH validation error:", validationResult.error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Parse date if provided
    let updateData: any = { ...data };
    if (data.date) {
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Use YYYY-MM-DD format." },
          { status: 400 }
        );
      }
      updateData.date = parsedDate;
    }

    // Call application service
    const result = await AdminKosLedgerAPI.updateEntry(resolvedParams.id, updateData);

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
    console.error("Error in update ledger entry API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Call application service
    const result = await AdminKosLedgerAPI.deleteEntry(resolvedParams.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.message === "Access denied" ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete ledger entry API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

