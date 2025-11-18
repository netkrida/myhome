/**
 * /api/superadmin/iklan/[id]
 * CRUD endpoints for specific advertisement
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { db } from "@/server/db";
import { z } from "zod";

// Validation schema for advertisement update
const advertisementUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  publicId: z.string().optional().nullable(),
  linkUrl: z.string().url("Invalid link URL").optional().or(z.literal("")).nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().or(z.literal("")).nullable(),
  endDate: z.string().datetime().optional().or(z.literal("")).nullable(),
});

/**
 * GET /api/superadmin/iklan/[id]
 * Get specific advertisement by ID
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const advertisement = await db.advertisement.findUnique({
      where: { id },
    });

    if (!advertisement) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: advertisement,
    });
  } catch (error) {
    console.error("❌ [GET Iklan by ID API] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/iklan/[id]
 * Update specific advertisement
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Check if advertisement exists
    const existing = await db.advertisement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input
    const validated = advertisementUpdateSchema.parse(body);

    // Prepare update data
    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.imageUrl !== undefined) updateData.imageUrl = validated.imageUrl;
    if (validated.publicId !== undefined) updateData.publicId = validated.publicId;
    if (validated.linkUrl !== undefined) updateData.linkUrl = validated.linkUrl || null;
    if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.startDate !== undefined) {
      updateData.startDate = validated.startDate ? new Date(validated.startDate) : null;
    }
    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate ? new Date(validated.endDate) : null;
    }

    // Update advertisement
    const advertisement = await db.advertisement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: advertisement,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("❌ [PATCH Iklan API] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/iklan/[id]
 * Delete specific advertisement
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Check if advertisement exists
    const existing = await db.advertisement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Delete advertisement
    await db.advertisement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully",
    });
  } catch (error) {
    console.error("❌ [DELETE Iklan API] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
