/**
 * /api/superadmin/iklan/[id]/review
 * Approve or reject advertisement
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { AdvertisementService } from "@/server/services/advertisement.service";
import {
  advertisementApprovalSchema,
  type AdvertisementApprovalInput,
} from "@/server/schemas/advertisement.schema";

const service = new AdvertisementService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/superadmin/iklan/[id]/review
 * Approve or reject advertisement
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    console.log("👀 SuperAdmin reviewing advertisement:", { id, reviewerId: userContext.id });

    // Validate input
    const validationResult = advertisementApprovalSchema.safeParse(body);
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

    const data: AdvertisementApprovalInput = validationResult.data;

    // Review advertisement
    const result = await service.reviewAdvertisement(id, data, userContext.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in POST /api/superadmin/iklan/[id]/review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
