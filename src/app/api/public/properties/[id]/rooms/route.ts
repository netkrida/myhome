import { NextRequest, NextResponse } from "next/server";
import { RoomRepository } from "@/server/repositories/adminkos/room.repository";
import { 
  publicPropertyRoomsQuerySchema, 
  type PublicPropertyRoomsQueryInput 
} from "@/server/schemas/room.schemas";

/**
 * GET /api/public/properties/[id]/rooms
 * Get public property rooms with filtering and pagination
 * Tier 1: HTTP API controller
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await context.params;

    console.log("[public/properties/rooms] GET request", { propertyId });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      roomType: searchParams.get("roomType") || undefined,
      isAvailable: searchParams.get("isAvailable") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      floor: searchParams.get("floor") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    };

    // Validate query parameters
    const validationResult = publicPropertyRoomsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.log("[public/properties/rooms] Invalid query parameters", validationResult.error.errors);
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid query parameters",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const query: PublicPropertyRoomsQueryInput = validationResult.data;

    console.log("[public/properties/rooms] Validated query:", { propertyId, query });

    // Get property rooms from repository
    const result = await RoomRepository.getPublicPropertyRooms(propertyId, query);

    if (!result) {
      console.log("[public/properties/rooms] Property not found or not approved", { propertyId });
      return NextResponse.json(
        {
          success: false,
          error: "Property not found or not available for public viewing"
        },
        { status: 404 }
      );
    }

    console.log("[public/properties/rooms] Success:", {
      propertyId,
      roomsCount: result.rooms.length,
      pagination: result.pagination
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("[public/properties/rooms] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
