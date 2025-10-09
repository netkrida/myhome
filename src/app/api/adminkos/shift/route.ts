/**
 * GET/POST /api/adminkos/shift
 * Shift assignment management endpoints
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { ShiftAPI } from "@/server/api/shift.api";
import {
  shiftAssignmentQuerySchema,
  createShiftAssignmentSchema,
  bulkShiftAssignmentSchema,
} from "@/server/schemas/receptionist.schemas";

/**
 * GET - Get shift assignments
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = shiftAssignmentQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const result = await ShiftAPI.getList(
      validationResult.data,
      userContext.id
    );

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
    console.error("Error in GET /api/adminkos/shift:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create shift assignment (single or bulk)
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if bulk assignment
    if (body.assignments && Array.isArray(body.assignments)) {
      const validationResult = bulkShiftAssignmentSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request data",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const result = await ShiftAPI.bulkCreate(
        validationResult.data,
        userContext.id
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.statusCode || 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: result.data,
        },
        { status: 201 }
      );
    }

    // Single assignment
    const validationResult = createShiftAssignmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const result = await ShiftAPI.create(
      validationResult.data,
      userContext.id
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/adminkos/shift:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

