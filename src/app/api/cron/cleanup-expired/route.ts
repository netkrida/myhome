/**
 * Tier-1: Cron Cleanup Expired Bookings API Route
 * Controller untuk cleanup expired bookings dan payments
 * 
 * Method: GET
 * Auth: Bearer token (CRON_SECRET)
 * 
 * Response: JSON report dengan metrik cleanup
 */

import { NextRequest, NextResponse } from "next/server";
import { CleanupExpiredBookingsService } from "@/server/api/booking/cleanupExpiredBookings";

/**
 * GET /api/cron/cleanup-expired
 * 
 * Cleanup expired payments dan bookings
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Validate Authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unauthorized: Missing or invalid Authorization header" 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron Cleanup] CRON_SECRET not configured");
      return NextResponse.json(
        { 
          success: false, 
          error: "Server configuration error" 
        },
        { status: 500 }
      );
    }

    if (token !== cronSecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unauthorized: Invalid token" 
        },
        { status: 401 }
      );
    }

    // Step 2: Get grace period from environment (default: 30 minutes)
    const graceMinutes = parseInt(
      process.env.BOOKING_UNPAID_GRACE_MINUTES || "30",
      10
    );

    if (isNaN(graceMinutes) || graceMinutes < 0) {
      console.error("[Cron Cleanup] Invalid BOOKING_UNPAID_GRACE_MINUTES:", process.env.BOOKING_UNPAID_GRACE_MINUTES);
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid grace period configuration" 
        },
        { status: 500 }
      );
    }

    // Step 3: Execute cleanup service
    const result = await CleanupExpiredBookingsService.execute(graceMinutes);

    if (!result.success) {
      console.error("[Cron Cleanup] Service error:", result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      );
    }

    // Step 4: Return success report
    console.log("[Cron Cleanup] Success:", result.data);
    
    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Cron Cleanup] Unexpected error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

