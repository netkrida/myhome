import { NextRequest, NextResponse } from "next/server";
import { RoomsAPI } from "@/server/api/rooms.api";
import { getCurrentUserContext } from "@/server/lib/auth";
import { 
  roomListQuerySchema, 
  createRoomSchema,
  type RoomListQueryInput,
  type CreateRoomInput
} from "@/server/schemas/room.schemas";

/**
 * GET /api/rooms
 * Get paginated list of rooms with filters
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
    const validationResult = roomListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const query: RoomListQueryInput = validationResult.data;

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

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in GET /api/rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms
 * Create new rooms for a property
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
    const validationResult = createRoomSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const roomData: CreateRoomInput = validationResult.data;

    // Create rooms
    const result = await RoomsAPI.createRooms(roomData);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to create rooms";
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
