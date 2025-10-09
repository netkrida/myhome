/**
 * GET/POST /api/adminkos/receptionist
 * Receptionist management endpoints
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { ReceptionistAPI } from "@/server/api/receptionist.api";
import {
  receptionistListQuerySchema,
  createReceptionistSchema,
} from "@/server/schemas/receptionist.schemas";

/**
 * GET - Get list of receptionists
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role
    if (userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Only AdminKos can access this endpoint" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validationResult = receptionistListQuerySchema.safeParse(queryParams);
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

    // Get receptionists
    const result = await ReceptionistAPI.getList(
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
    console.error("Error in GET /api/adminkos/receptionist:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new receptionist
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role
    if (userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Only AdminKos can create receptionists" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createReceptionistSchema.safeParse(body);
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

    // Create receptionist
    const result = await ReceptionistAPI.create(
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
    console.error("Error in POST /api/adminkos/receptionist:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

