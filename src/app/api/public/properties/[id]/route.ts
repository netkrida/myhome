import { NextRequest, NextResponse } from "next/server";
import { PropertyRepository } from "@/server/repositories/property.repository";
import { publicPropertyDetailIdSchema, type PublicPropertyDetailIdInput } from "@/server/schemas/property.schemas";

/**
 * GET /api/public/properties/[id]
 * Get public property detail by ID
 * Tier 1: HTTP API controller
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;

    console.log("[public/properties] GET request", { id: rawId });

    // Validate property ID parameter
    const validationResult = publicPropertyDetailIdSchema.safeParse({ id: rawId });
    if (!validationResult.success) {
      console.log("[public/properties] Invalid ID", validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid property ID format",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: PublicPropertyDetailIdInput = validationResult.data;

    console.log("[public/properties] Validated ID", id);

    // Get property detail from repository
    const property = await PropertyRepository.getPublicPropertyDetail(id);

    if (!property) {
      console.log("[public/properties] Property not found or not approved", { id });
      return NextResponse.json(
        {
          success: false,
          error: "Property not found or not available for public viewing"
        },
        { status: 404 }
      );
    }

    console.log("[public/properties] Success", {
      propertyId: property.id,
      propertyName: property.name,
      imagesCount: property.images.length,
      roomsCount: property.rooms.length
    });

    return NextResponse.json({
      success: true,
      data: property,
    });

  } catch (error) {
    console.error("[public/properties] Error in GET handler", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
