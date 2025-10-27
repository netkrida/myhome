import { NextRequest, NextResponse } from "next/server";
import { RoomRepository } from "@/server/repositories/adminkos/room.repository";
import { 
  propertyRoomTypesIdSchema, 
  propertyRoomTypesQuerySchema,
  type PropertyRoomTypesIdInput,
  type PropertyRoomTypesQueryInput 
} from "@/server/schemas/room.schemas";

/**
 * GET /api/public/properties/[id]/room-types
 * Get property room types with availability information
 * Tier 1: HTTP API controller
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;

    console.log("[public/properties/room-types] GET request", { id: rawId });

    // Validate property ID parameter
    const idValidationResult = propertyRoomTypesIdSchema.safeParse({ id: rawId });
    if (!idValidationResult.success) {
      console.log("[public/properties/room-types] Invalid ID", idValidationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid property ID format",
          details: idValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: PropertyRoomTypesIdInput = idValidationResult.data;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      includeOccupied: searchParams.get("includeOccupied") || undefined,
      roomType: searchParams.get("roomType") || undefined,
    };

    const queryValidationResult = propertyRoomTypesQuerySchema.safeParse(queryParams);
    if (!queryValidationResult.success) {
      console.log("[public/properties/room-types] Invalid query parameters", queryValidationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: queryValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const query: PropertyRoomTypesQueryInput = queryValidationResult.data;

    console.log("[public/properties/room-types] Validated parameters:", { id, query });

    // Get property room types from repository
    const result = await RoomRepository.getPropertyRoomTypes(id, query);

    if (!result) {
      console.log("[public/properties/room-types] Property not found or not approved", { id });
      return NextResponse.json(
        {
          success: false,
          error: "Property not found or not available for public viewing"
        },
        { status: 404 }
      );
    }

    console.log("[public/properties/room-types] Success:", {
      propertyId: id,
      roomTypesCount: result.roomTypes.length,
      summary: result.summary
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("[public/properties/room-types] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
