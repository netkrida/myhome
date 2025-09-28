import { NextRequest, NextResponse } from "next/server";
import { PropertiesAPI } from "@/server/api/properties.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  propertyApprovalSchema,
  propertyIdSchema,
  type PropertyApprovalInput,
  type PropertyIdInput
} from "@/server/schemas/property.schemas";

/**
 * POST /api/properties/[id]/approve
 * Approve or reject property
 */
export async function POST(
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
    console.log("Received approval request body:", body);

    // Validate request body
    const validationResult = propertyApprovalSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.errors);
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const approvalData: PropertyApprovalInput = validationResult.data;

    // Approve/reject property
    const result = await PropertiesAPI.approveProperty(id, approvalData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to process property approval";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in POST /api/properties/[id]/approve:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
