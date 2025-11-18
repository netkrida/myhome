/**
 * /api/superadmin/iklan
 * CRUD endpoints for advertisements
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { db } from "@/server/db";
import { z } from "zod";

// Validation schema for advertisement
const advertisementSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL"),
  publicId: z.string().optional().nullable(),
  linkUrl: z.string().url("Invalid link URL").optional().or(z.literal("")).nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional().or(z.literal("")).nullable(),
  endDate: z.string().datetime().optional().or(z.literal("")).nullable(),
});

/**
 * GET /api/superadmin/iklan
 * Get all advertisements with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    // Get advertisements
    const advertisements = await db.advertisement.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" }
      ],
    });

    return NextResponse.json({
      success: true,
      data: advertisements,
    });
  } catch (error) {
    console.error("❌ [GET Iklan API] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/iklan
 * Create new advertisement
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validated = advertisementSchema.parse(body);

    // Create advertisement
    const advertisement = await db.advertisement.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        imageUrl: validated.imageUrl,
        publicId: validated.publicId || null,
        linkUrl: validated.linkUrl || null,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        createdBy: userContext.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: advertisement,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("❌ [POST Iklan API] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
