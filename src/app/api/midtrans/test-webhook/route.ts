import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/midtrans/test-webhook
 * Test endpoint to verify webhook URL is accessible
 * 
 * Midtrans dashboard can hit this URL to verify it's reachable.
 * This should return 200 OK if the server is accessible.
 */
export async function GET(request: NextRequest) {
  console.log("🧪 Midtrans webhook test endpoint hit!");
  console.log("🧪 Request from:", request.headers.get("x-forwarded-for") || "unknown");
  console.log("🧪 User-Agent:", request.headers.get("user-agent"));
  
  return NextResponse.json({
    success: true,
    message: "Midtrans webhook endpoint is reachable",
    timestamp: new Date().toISOString(),
    server: "boxbook",
    endpoint: "/api/midtrans/notify"
  });
}

/**
 * POST /api/midtrans/test-webhook
 * Simulate a Midtrans notification for testing
 * 
 * Use this to manually trigger a payment confirmation for testing.
 * DO NOT use in production without proper security!
 * 
 * Request body:
 * {
 *   "order_id": "FULL-XXXXX-XXXXXX",
 *   "transaction_status": "settlement",
 *   "simulate": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("🧪 ========================================");
    console.log("🧪 SIMULATED WEBHOOK TEST");
    console.log("🧪 ========================================");
    console.log("📦 Payload:", JSON.stringify(body, null, 2));
    console.log("🧪 ========================================");

    // Only allow in development
    if (process.env.NODE_ENV === "production" && !body.simulate) {
      return NextResponse.json({
        success: false,
        error: "Test endpoint disabled in production"
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: "Test webhook received",
      receivedPayload: body,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("🧪 Test webhook error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process test webhook"
    }, { status: 500 });
  }
}
