import { NextRequest, NextResponse } from "next/server";
import { UsersAPI } from "@/server/api/users.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  userIdSchema, 
  changeUserStatusSchema,
  type UserIdInput,
  type ChangeUserStatusInput
} from "@/server/schemas/user.schemas";

/**
 * PATCH /api/users/[id]/status
 * Change user status (active/inactive)
 */
export async function PATCH(
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

    const { id } = await params;

    // Validate user ID
    const idValidationResult = userIdSchema.safeParse({ id });
    if (!idValidationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid user ID",
          details: idValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id: validatedId }: UserIdInput = idValidationResult.data;

    // Parse request body
    const body = await request.json();

    // Validate request body
    const bodyValidationResult = changeUserStatusSchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: bodyValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const statusData: ChangeUserStatusInput = bodyValidationResult.data;

    // Change user status
    const result = await UsersAPI.changeUserStatus(validatedId, statusData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to change user status";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PATCH /api/users/[id]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
