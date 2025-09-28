import { NextRequest, NextResponse } from "next/server";
import { RoomsAPI } from "@/server/api/rooms.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  propertyIdSchema,
  type PropertyIdInput
} from "@/server/schemas/property.schemas";

/**
 * GET /api/properties/[id]/rooms
 * Get rooms by property ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user context
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await params
    const resolvedParams = await params;

    // Validate property ID
    const validationResult = propertyIdSchema.safeParse({ id: resolvedParams.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid property ID",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id: propertyId }: PropertyIdInput = validationResult.data;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = {
      propertyId,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
      roomType: searchParams.get("roomType") || undefined,
      isAvailable: searchParams.get("isAvailable") === "true" ? true : 
                   searchParams.get("isAvailable") === "false" ? false : undefined,
      minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
      floor: searchParams.get("floor") ? parseInt(searchParams.get("floor")!) : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "roomNumber",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    };

    console.log("🏠 GET /api/properties/[id]/rooms - Query:", {
      propertyId,
      query
    });

    // Get rooms
    const result = await RoomsAPI.getAllRooms(query);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get rooms";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/properties/[id]/rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
