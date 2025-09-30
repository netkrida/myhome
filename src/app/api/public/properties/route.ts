import { NextRequest, NextResponse } from "next/server";
import { PropertyRepository } from "@/server/repositories/property.repository";
import { publicPropertiesQuerySchema, type PublicPropertiesQueryInput } from "@/server/schemas/property.schemas";

/**
 * GET /api/public/properties
 * Get public properties for homepage
 * Tier 1: HTTP API controller
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      propertyType: searchParams.get("propertyType") || undefined,
      regencyCode: searchParams.get("regencyCode") || undefined,
      districtCode: searchParams.get("districtCode") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    };

    // Validate query parameters
    const validationResult = publicPropertiesQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid query parameters",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const query: PublicPropertiesQueryInput = validationResult.data;

    console.log("🔍 GET /api/public/properties - Query:", query);

    // Get properties from repository
    const result = await PropertyRepository.getPublicProperties(query);

    console.log("✅ GET /api/public/properties - Success:", {
      propertiesCount: result.properties.length,
      pagination: result.pagination
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("❌ Error in GET /api/public/properties:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    );
  }
}
