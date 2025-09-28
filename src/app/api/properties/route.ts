import { NextRequest, NextResponse } from "next/server";
import { PropertiesAPI } from "@/server/api/properties.api";
import { PropertyService } from "@/server/services/property.service";
import { PropertyRepository } from "@/server/repositories/property.repository";
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
    console.log("=== PROPERTY CREATION API DEBUG ===");
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Validate request body
    const validationResult = createPropertySchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors);
      console.error("Body structure:", Object.keys(body));
      if (body.step1) console.error("Step1 keys:", Object.keys(body.step1));
      if (body.step2) console.error("Step2 keys:", Object.keys(body.step2));
      if (body.step3) console.error("Step3 keys:", Object.keys(body.step3));
      if (body.step4) console.error("Step4 keys:", Object.keys(body.step4));

      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const propertyData: CreatePropertyInput = validationResult.data;

    // Create property - call the repository directly to bypass withAuth wrapper
    console.log("🔍 Creating property with userContext:", {
      id: userContext.id,
      role: userContext.role,
      email: userContext.email
    });

    // Ensure required location data is present
    if (!propertyData.step2.location.provinceName || !propertyData.step2.location.regencyName || !propertyData.step2.location.districtName) {
      return NextResponse.json(
        {
          error: "Incomplete location data",
          details: "Province, regency, and district names are required"
        },
        { status: 400 }
      );
    }

    // Validate property data using the service
    const validation = PropertyService.validatePropertyCreation(propertyData);
    if (!validation.isValid) {
      console.error("Property creation validation failed:", validation.errors);
      return NextResponse.json(
        {
          error: "Invalid property data",
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Create property directly using repository
    const property = await PropertyRepository.create(propertyData, userContext.id);

    // Get full property details
    const fullProperty = await PropertyRepository.findById(property.id, true, true, true);

    return NextResponse.json(fullProperty, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/properties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
