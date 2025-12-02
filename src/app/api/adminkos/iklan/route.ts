/**
 * /api/adminkos/iklan
 * AdminKos advertisement submission management
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { AdvertisementService } from "@/server/services/advertisement.service";
import {
  advertisementSubmitSchema,
  type AdvertisementSubmitInput,
} from "@/server/schemas/advertisement.schema";

const service = new AdvertisementService();

/**
 * GET /api/adminkos/iklan
 * Get all advertisements submitted by current AdminKos
 */
export async function GET() {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 AdminKos fetching their advertisements:", userContext.id);

    const result = await service.getMyAdvertisements(userContext.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/adminkos/iklan:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/adminkos/iklan
 * Submit new advertisement
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📝 AdminKos submitting advertisement:", { userId: userContext.id, body });

    // Validate input
    const validationResult = advertisementSubmitSchema.safeParse(body);
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

    const data: AdvertisementSubmitInput = validationResult.data;

    // Submit advertisement
    const result = await service.submitAdvertisement(data, userContext.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in POST /api/adminkos/iklan:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
