import { NextRequest, NextResponse } from "next/server";
import { PropertiesAPI } from "@/server/api/properties.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  updatePropertySchema,
  propertyIdSchema,
  type UpdatePropertyInput,
  type PropertyIdInput
} from "@/server/schemas/property.schemas";

/**
 * GET /api/properties/[id]
 * Get property by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔍 GET /api/properties/[id] - Start");

    // Get user context
    const userContext = await getCurrentUserContext();
    console.log("🔍 User context:", {
      found: !!userContext,
      userId: userContext?.id,
      role: userContext?.role,
      email: userContext?.email
    });

    if (!userContext) {
      console.log("🔍 Authentication failed - no user context");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await params
    const resolvedParams = await params;
    console.log("🔍 Resolved params:", resolvedParams);

    // Validate property ID
    const validationResult = propertyIdSchema.safeParse({ id: resolvedParams.id });
    console.log("🔍 Property ID validation:", {
      success: validationResult.success,
      id: resolvedParams.id,
      errors: validationResult.success ? null : validationResult.error.errors
    });

    if (!validationResult.success) {
      console.log("🔍 Property ID validation failed");
      return NextResponse.json(
        {
          error: "Invalid property ID",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: PropertyIdInput = validationResult.data;
    console.log("🔍 Validated property ID:", id);

    // Get property
    console.log("🔍 Calling PropertiesAPI.getPropertyById with:", { userContext: userContext.id, id });
    const result = await PropertiesAPI.getPropertyById(id);
    console.log("🔍 PropertiesAPI.getPropertyById result:", {
      success: result.success,
      hasData: !!(result as any).data,
      error: result.success ? null : (result as any).error,
      statusCode: (result as any).statusCode
    });

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get property";

      console.log("🔍 API call failed:", {
        error: errorResult.error,
        statusCode: errorResult.statusCode,
        errorMessage
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    console.log("🔍 API call successful, returning data");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/properties/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/properties/[id]
 * Update property
 */
export async function PUT(
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
    const idValidationResult = propertyIdSchema.safeParse({ id: resolvedParams.id });
    if (!idValidationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid property ID",
          details: idValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id }: PropertyIdInput = idValidationResult.data;

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = updatePropertySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updateData: UpdatePropertyInput = validationResult.data;

    // Update property
    const result = await PropertiesAPI.updateProperty(id, updateData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to update property";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PUT /api/properties/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/[id]
 * Delete property (soft delete by setting status)
 */
export async function DELETE(
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

    const { id }: PropertyIdInput = validationResult.data;

    console.log("🗑️ DELETE API - Processing delete for property:", id);
    console.log("🗑️ DELETE API - User context:", {
      userId: userContext.id,
      role: userContext.role,
      email: userContext.email
    });

    // Check if user can manage this property by trying to get it first
    const property = await PropertiesAPI.getPropertyById(id);
    
    if (!property.success) {
      console.log("🗑️ DELETE API - Property not found or access denied:", property);
      const errorResult = property as any;
      return NextResponse.json(
        { error: errorResult.error?.message || "Property not found or access denied" },
        { status: errorResult.statusCode || 404 }
      );
    }

    console.log("🗑️ DELETE API - Property found, proceeding with hard delete");

    // Hard delete - completely remove the property from database
    const { PropertyRepository } = await import("@/server/repositories/global/property.repository");
    
    try {
      // Perform hard delete - remove property and all related data
      await PropertyRepository.delete(id);

      console.log("🗑️ DELETE API - Property permanently deleted from database");
    } catch (repoError) {
      console.error("🗑️ DELETE API - Repository error:", repoError);
      throw new Error("Failed to delete property from database");
    }

    console.log("🗑️ DELETE API - Hard delete operation completed successfully");

    return NextResponse.json({ 
      success: true,
      message: "Property deleted successfully" 
    });
  } catch (error) {
    console.error("Error in DELETE /api/properties/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
