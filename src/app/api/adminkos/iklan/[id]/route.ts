/**
 * /api/adminkos/iklan/[id]
 * AdminKos advertisement detail management
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { AdvertisementService } from "@/server/services/advertisement.service";
import {
  advertisementUpdateSchema,
  type AdvertisementUpdateInput,
} from "@/server/schemas/advertisement.schema";

const service = new AdvertisementService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/adminkos/iklan/[id]
 * Get advertisement detail
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("🔍 AdminKos fetching advertisement detail:", { id, userId: userContext.id });

    const result = await service.getAdvertisementById(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    // Check ownership
    if (result.data!.submittedBy !== userContext.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/adminkos/iklan/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/adminkos/iklan/[id]
 * Update advertisement (only if PENDING or APPROVED)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log("✏️ AdminKos updating advertisement:", { id, userId: userContext.id });

    // Validate input
    const validationResult = advertisementUpdateSchema.safeParse(body);
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

    const data: AdvertisementUpdateInput = validationResult.data;

    // Update advertisement
    const result = await service.updateAdvertisement(id, data, userContext.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in PATCH /api/adminkos/iklan/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/adminkos/iklan/[id]
 * Delete advertisement (only if PENDING or REJECTED)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("🗑️ AdminKos deleting advertisement:", { id, userId: userContext.id });

    const result = await service.deleteAdvertisement(id, userContext.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error in DELETE /api/adminkos/iklan/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
