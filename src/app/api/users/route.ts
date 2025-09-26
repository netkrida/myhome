import { NextRequest, NextResponse } from "next/server";
import { UsersAPI } from "@/server/api/users.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  userListQuerySchema, 
  createUserSchema,
  type UserListQueryInput,
  type CreateUserInput
} from "@/server/schemas/user.schemas";

/**
 * GET /api/users
 * Get paginated list of users with filters
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
    const validationResult = userListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const query: UserListQueryInput = validationResult.data;

    // Get users
    const result = await UsersAPI.getAllUsers(query);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to get users";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create new user
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
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const userData: CreateUserInput = validationResult.data;

    // Create user
    const result = await UsersAPI.createUser(userData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to create user";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
