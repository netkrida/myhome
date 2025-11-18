/**
 * /api/public/iklan
 * Public endpoint to get active advertisements
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/public/iklan
 * Get active advertisements for public display
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // Get active advertisements
    const advertisements = await db.advertisement.findMany({
      where: {
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } }
            ]
          },
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: null }
            ]
          },
          {
            AND: [
              { startDate: null },
              { endDate: null }
            ]
          }
        ]
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        linkUrl: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: advertisements,
    });
  } catch (error) {
    console.error("❌ [GET Public Iklan API] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
