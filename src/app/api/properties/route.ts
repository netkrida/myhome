import { NextRequest, NextResponse } from "next/server";
import { PropertiesAPI } from "@/server/api/properties.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  propertyListQuerySchema, 
  createPropertySchema,
  type PropertyListQueryInput,
  type CreatePropertyInput
} from "@/server/schemas/property.schemas";

/**
 * GET /api/properties
 * Get paginated list of properties with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Get user context
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, any> = {};
    
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Validate query parameters
    const validationResult = propertyListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const query: PropertyListQueryInput = validationResult.data;

    // Get properties
    const result = await PropertiesAPI.getAllProperties(query);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get properties";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/properties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties
 * Create new property
 */
export async function POST(request: NextRequest) {
  try {
    // Get user context
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createPropertySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const propertyData: CreatePropertyInput = validationResult.data;

    // Create property
    const result = await PropertiesAPI.createProperty(propertyData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to create property";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/properties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
