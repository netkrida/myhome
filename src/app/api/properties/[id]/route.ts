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
  { params }: { params: { id: string } }
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

    // Validate property ID
    const validationResult = propertyIdSchema.safeParse({ id: params.id });
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

    // Get property
    const result = await PropertiesAPI.getPropertyById(id);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get property";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
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
  { params }: { params: { id: string } }
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

    // Validate property ID
    const idValidationResult = propertyIdSchema.safeParse({ id: params.id });
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
  { params }: { params: { id: string } }
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

    // Validate property ID
    const validationResult = propertyIdSchema.safeParse({ id: params.id });
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

    // For now, we'll implement this as a status change to REJECTED
    // In a real implementation, you might want a separate delete endpoint
    const result = await PropertiesAPI.approveProperty(id, { 
      status: 'REJECTED' as any,
      rejectionReason: 'Property deleted by owner'
    });

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to delete property";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/properties/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
