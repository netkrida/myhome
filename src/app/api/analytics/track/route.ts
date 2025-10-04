import { NextRequest, NextResponse } from "next/server";
import { AnalyticsAPI } from "@/server/api/analytics.api";
import { AnalyticsService } from "@/server/services/analytics.service";
import type { VisitorTrackingInput } from "@/server/types/analytics";

/**
 * POST /api/analytics/track
 * Track visitor and page view (public endpoint)
 * No authentication required
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.sessionId || !body.page) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId and page are required" },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress = AnalyticsService.getClientIP(request.headers);
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined;

    // Prepare tracking input
    const trackingInput: VisitorTrackingInput = {
      sessionId: body.sessionId,
      page: body.page,
      title: body.title,
      referrer: body.referrer,
      userAgent,
      timeSpent: body.timeSpent ? parseInt(body.timeSpent) : undefined,
    };

    // Track the visitor
    const result = await AnalyticsAPI.trackVisitor(trackingInput, ipAddress, userAgent);

    if (!result.success) {
      const errorResult = result as any;
      const errorMessage = typeof errorResult.error === 'string'
        ? errorResult.error
        : errorResult.error?.message || "Failed to track visitor";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: errorResult.statusCode || 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in POST /api/analytics/track:", error);
    // Don't return error to avoid breaking the main application
    return NextResponse.json(
      { success: false, error: "Tracking failed" },
      { status: 200 } // Return 200 to avoid breaking the frontend
    );
  }
}

/**
 * GET /api/analytics/track
 * Simple endpoint to track page views via GET request (for img pixel tracking)
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const sessionId = searchParams.get('sessionId');
    const page = searchParams.get('page');
    const title = searchParams.get('title');
    const referrer = searchParams.get('referrer');
    
    if (!sessionId || !page) {
      return NextResponse.json(
        { error: "Missing required parameters: sessionId and page are required" },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress = AnalyticsService.getClientIP(request.headers);
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined;

    // Prepare tracking input
    const trackingInput: VisitorTrackingInput = {
      sessionId,
      page,
      title: title || undefined,
      referrer: referrer || undefined,
      userAgent,
    };

    // Track the visitor
    await AnalyticsAPI.trackVisitor(trackingInput, ipAddress, userAgent);

    // Return a 1x1 transparent pixel for image-based tracking
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error in GET /api/analytics/track:", error);
    
    // Return a 1x1 transparent pixel even on error
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString(),
      },
    });
  }
}
