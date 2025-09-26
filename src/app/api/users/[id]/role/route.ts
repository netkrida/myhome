import { NextRequest, NextResponse } from "next/server";
import { UsersAPI } from "@/server/api/users.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  userIdSchema, 
  changeUserRoleSchema,
  type UserIdInput,
  type ChangeUserRoleInput
} from "@/server/schemas/user.schemas";

/**
 * PATCH /api/users/[id]/role
 * Change user role
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
    const bodyValidationResult = changeUserRoleSchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: bodyValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const roleData: ChangeUserRoleInput = bodyValidationResult.data;

    // Change user role
    const result = await UsersAPI.changeUserRole(validatedId, roleData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to change user role";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PATCH /api/users/[id]/role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
