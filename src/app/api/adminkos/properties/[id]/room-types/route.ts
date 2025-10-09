/**
 * /api/adminkos/properties/[id]/room-types
 * GET: Get unique room types for a property (for AdminKos)
 * POST: Create multiple rooms with same room type
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { auth } from "@/server/auth";
import { createRoomType } from "@/server/api/adminkos.api";

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

    // Get unique room types from this property
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      select: { roomType: true },
      distinct: ["roomType"],
      orderBy: { roomType: "asc" },
    });

    const roomTypes = rooms.map((room) => room.roomType);

    return NextResponse.json({
      success: true,
      data: { roomTypes },
    });
  } catch (error) {
    console.error("Error in GET /api/adminkos/properties/[id]/room-types:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    if (session.user.role !== "ADMINKOS") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin Kos only" },
        { status: 403 }
      );
    }

    const { id: propertyId } = await context.params;
    const body = await request.json();

    const result = await createRoomType(session.user.id, propertyId, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Berhasil menambahkan ${result.data?.roomsCreated} kamar tipe ${body.roomType}`,
    });
  } catch (error) {
    console.error("Error creating room type:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
