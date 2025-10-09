/**
 * GET /api/adminkos/properties/[id]/room-types-summary
 * Get room types summary for a property (for AdminKos)
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { auth } from "@/server/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: propertyId } = await context.params;

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

    // Get all rooms grouped by room type
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      select: {
        id: true,
        roomType: true,
        monthlyPrice: true,
        isAvailable: true,
      },
      orderBy: { roomType: 'asc' }
    });

    // Get room type images (shared images)
    const roomTypeImages = await prisma.roomTypeImage.findMany({
      where: {
        propertyId,
        category: 'ROOM_PHOTOS'
      },
      select: {
        roomType: true,
        imageUrl: true,
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Create a map of room type to first image
    const roomTypeImageMap = new Map<string, string>();
    for (const img of roomTypeImages) {
      if (!roomTypeImageMap.has(img.roomType)) {
        roomTypeImageMap.set(img.roomType, img.imageUrl);
      }
    }

    // Group by room type
    const roomTypeMap = new Map<string, {
      roomType: string;
      totalRooms: number;
      availableRooms: number;
      occupiedRooms: number;
      lowestPrice: number;
      highestPrice: number;
      mainImage: string | null;
    }>();

    rooms.forEach(room => {
      const existing = roomTypeMap.get(room.roomType);
      const price = Number(room.monthlyPrice);

      if (existing) {
        existing.totalRooms++;
        if (room.isAvailable) existing.availableRooms++;
        else existing.occupiedRooms++;
        existing.lowestPrice = Math.min(existing.lowestPrice, price);
        existing.highestPrice = Math.max(existing.highestPrice, price);
      } else {
        roomTypeMap.set(room.roomType, {
          roomType: room.roomType,
          totalRooms: 1,
          availableRooms: room.isAvailable ? 1 : 0,
          occupiedRooms: room.isAvailable ? 0 : 1,
          lowestPrice: price,
          highestPrice: price,
          mainImage: roomTypeImageMap.get(room.roomType) || null
        });
      }
    });

    const roomTypes = Array.from(roomTypeMap.values());

    return NextResponse.json({
      success: true,
      data: {
        totalRoomTypes: roomTypes.length,
        totalRooms: rooms.length,
        roomTypes
      },
    });
  } catch (error) {
    console.error("Error in GET /api/adminkos/properties/[id]/room-types-summary:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

