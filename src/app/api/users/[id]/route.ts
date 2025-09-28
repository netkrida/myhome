import { NextRequest, NextResponse } from "next/server";
import { UsersAPI } from "@/server/api/users.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import {
  userIdSchema,
  updateUserSchema,
  type UserIdInput
} from "@/server/schemas/user.schemas";
import { type UpdateUserInput } from "@/server/schemas/auth";

/**
 * GET /api/users/[id]
 * Get single user by ID
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

    const { id } = await params;

    // Validate user ID
    const validationResult = userIdSchema.safeParse({ id });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid user ID",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id: validatedId }: UserIdInput = validationResult.data;

    // Get user
    const result = await UsersAPI.getUserById(validatedId);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get user";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Update existing user
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
    const bodyValidationResult = updateUserSchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: bodyValidationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updateData: UpdateUserInput = bodyValidationResult.data;

    // Update user
    const result = await UsersAPI.updateUser(validatedId, updateData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to update user";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Soft delete user
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

    const { id } = await params;

    // Validate user ID
    const validationResult = userIdSchema.safeParse({ id });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid user ID",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id: validatedId }: UserIdInput = validationResult.data;

    // Delete user
    const result = await UsersAPI.deleteUser(validatedId);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to delete user";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
