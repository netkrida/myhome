import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

/**
 * GET /api/payments/latest
 * Get latest payment for current user
 *
 * This endpoint is used by success page to auto-detect order ID
 * when orderId is not in URL or localStorage
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "orderId": "FULL-XXX-YYY",
 *     "paymentId": "xxx",
 *     "status": "SUCCESS",
 *     "createdAt": "2025-10-07T..."
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    console.log("🔍 GET /api/payments/latest - User:", userId);

    // Get latest payment for user
    // Order by createdAt DESC to get most recent
    // Filter by recent payments (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const latestPayment = await prisma.payment.findFirst({
      where: {
        userId,
        createdAt: {
          gte: thirtyMinutesAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        midtransOrderId: true,
        status: true,
        createdAt: true,
        amount: true
      }
    });

    if (!latestPayment) {
      console.log("❌ No recent payment found for user:", userId);
      return NextResponse.json(
        { 
          success: false, 
          error: "No recent payment found. Please check your dashboard." 
        },
        { status: 404 }
      );
    }

    console.log("✅ Latest payment found:", {
      orderId: latestPayment.midtransOrderId,
      status: latestPayment.status,
      createdAt: latestPayment.createdAt
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: latestPayment.midtransOrderId,
        paymentId: latestPayment.id,
        status: latestPayment.status,
        amount: Number(latestPayment.amount),
        createdAt: latestPayment.createdAt
      }
    });

  } catch (error: any) {
    console.error("GET /api/payments/latest error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

