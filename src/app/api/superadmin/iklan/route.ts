/**
 * /api/superadmin/iklan
 * SuperAdmin advertisement management - approval & layout
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { AdvertisementService } from "@/server/services/advertisement.service";

const service = new AdvertisementService();

/**
 * GET /api/superadmin/iklan
 * Get all advertisements or filter by status
 * Query params: ?status=PENDING|APPROVED|PLACED|REJECTED|EXPIRED
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    console.log("🔍 SuperAdmin fetching advertisements:", { status });

    let result;

    switch (status) {
      case "PENDING":
        result = await service.getPendingAdvertisements();
        break;
      case "APPROVED":
        result = await service.getApprovedUnplacedAdvertisements();
        break;
      case "PLACED":
        result = await service.getPlacedAdvertisements();
        break;
      default:
        result = await service.getAllAdvertisements();
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/superadmin/iklan:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
