/**
 * /api/superadmin/iklan/[id]/place
 * Place advertisement in layout or remove from layout
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { AdvertisementService } from "@/server/services/advertisement.service";
import {
  advertisementPlacementSchema,
  type AdvertisementPlacementInput,
} from "@/server/schemas/advertisement.schema";

const service = new AdvertisementService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/superadmin/iklan/[id]/place
 * Place advertisement in layout slot
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    console.log("📌 SuperAdmin placing advertisement:", { id });

    // Validate input
    const validationResult = advertisementPlacementSchema.safeParse(body);
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

    const data: AdvertisementPlacementInput = validationResult.data;

    // Place advertisement
    const result = await service.placeAdvertisement(id, data);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in POST /api/superadmin/iklan/[id]/place:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/iklan/[id]/place
 * Remove advertisement from layout
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    console.log("🗑️ SuperAdmin removing advertisement from layout:", { id });

    // Remove from layout
    const result = await service.removeFromLayout(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in DELETE /api/superadmin/iklan/[id]/place:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
