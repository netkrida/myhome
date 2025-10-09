/**
 * GET /api/adminkos/bookings/[id]
 * Get booking details by ID
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { prisma } from "@/server/db/client";

/**
 * GET - Get booking details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext || userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch booking with all related data
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        property: {
          ownerId: userContext.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            provinceName: true,
            regencyName: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            floor: true,
            description: true,
            size: true,
            monthlyPrice: true,
            facilities: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error in GET /api/adminkos/bookings/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

