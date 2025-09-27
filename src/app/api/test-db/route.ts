import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/test-db
 * Test database connection
 */
export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    const userCount = await db.user.count();
    const propertyCount = await db.property.count();
    
    return NextResponse.json({
      success: true,
      data: {
        userCount,
        propertyCount,
        message: "Database connection successful"
      },
    });
  } catch (error) {
    console.error("Error in GET /api/test-db:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Database connection failed";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
