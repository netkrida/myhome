/**
 * /api/public/iklan
 * Public endpoint to get active advertisements by layout slot
 */

import { NextRequest, NextResponse } from "next/server";
import { AdvertisementService } from "@/server/services/advertisement.service";

const service = new AdvertisementService();

/**
 * GET /api/public/iklan?slot=1|2
 * Get active advertisements for specific layout slot
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slotParam = searchParams.get("slot");

    if (!slotParam) {
      return NextResponse.json(
        { success: false, error: "Layout slot parameter required" },
        { status: 400 }
      );
    }

    const layoutSlot = parseInt(slotParam, 10);
    if (isNaN(layoutSlot) || layoutSlot < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid layout slot" },
        { status: 400 }
      );
    }

    console.log("🔍 Fetching public advertisements for slot:", layoutSlot);

    const result = await service.getPublicAdvertisementsBySlot(layoutSlot);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/public/iklan:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
