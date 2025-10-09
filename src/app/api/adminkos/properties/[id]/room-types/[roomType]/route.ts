/**
 * GET /api/adminkos/properties/[id]/room-types/[roomType]
 * Get room type details including sample room data and images
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { auth } from "@/server/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; roomType: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: propertyId, roomType } = await context.params;

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property || property.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Property not found or access denied" },
        { status: 403 }
      );
    }

    const decodedRoomType = decodeURIComponent(roomType);

    // Get first room of this type (as sample for data)
    const sampleRoom = await prisma.room.findFirst({
      where: {
        propertyId,
        roomType: decodedRoomType,
      },
    });

    if (!sampleRoom) {
      return NextResponse.json(
        { success: false, error: "Room type not found" },
        { status: 404 }
      );
    }

    // Get shared images for this room type
    const roomTypeImages = await prisma.roomTypeImage.findMany({
      where: {
        propertyId,
        roomType: decodedRoomType,
      },
      orderBy: { sortOrder: "asc" },
    });

    // Return room type details
    const roomTypeDetail = {
      roomType: sampleRoom.roomType,
      description: sampleRoom.description,
      size: sampleRoom.size,
      facilities: sampleRoom.facilities,
      monthlyPrice: Number(sampleRoom.monthlyPrice),
      dailyPrice: sampleRoom.dailyPrice ? Number(sampleRoom.dailyPrice) : undefined,
      weeklyPrice: sampleRoom.weeklyPrice ? Number(sampleRoom.weeklyPrice) : undefined,
      quarterlyPrice: sampleRoom.quarterlyPrice ? Number(sampleRoom.quarterlyPrice) : undefined,
      yearlyPrice: sampleRoom.yearlyPrice ? Number(sampleRoom.yearlyPrice) : undefined,
      images: roomTypeImages.map(img => ({
        imageUrl: img.imageUrl,
        category: img.category,
      })),
    };

    return NextResponse.json({
      success: true,
      data: roomTypeDetail,
    });
  } catch (error) {
    console.error("Error in GET /api/adminkos/properties/[id]/room-types/[roomType]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

