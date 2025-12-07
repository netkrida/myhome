import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

/**
 * GET /api/payments/validate-token?token=xxx
 * Validate payment token and return payment info
 * 
 * This endpoint is PUBLIC (no auth required) because:
 * - Users receive payment link via email/SMS
 * - Token itself is the authentication (like a password reset link)
 * - Token is single-use and expires
 * 
 * Query params:
 * - token: Payment token (Midtrans Snap token)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "paymentId": "...",
 *     "orderId": "...",
 *     "amount": 1000000,
 *     "status": "PENDING",
 *     "booking": { ... }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    console.log("🔍 GET /api/payments/validate-token - Validating token");

    if (!token) {
      console.error("❌ Token is required");
      return NextResponse.json(
        { success: false, error: "Token pembayaran tidak ditemukan" },
        { status: 400 }
      );
    }

    // Find payment by token
    const payment = await prisma.payment.findFirst({
      where: {
        paymentToken: token,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingCode: true,
            checkInDate: true,
            checkOutDate: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
            room: {
              select: {
                id: true,
                roomNumber: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      console.error("❌ Payment not found for token");
      return NextResponse.json(
        { success: false, error: "Token pembayaran tidak valid atau sudah kadaluarsa" },
        { status: 404 }
      );
    }

    // Check if payment is already completed
    if (payment.status === "SUCCESS") {
      console.log("⚠️ Payment already completed");
      return NextResponse.json(
        { success: false, error: "Pembayaran sudah selesai" },
        { status: 400 }
      );
    }

    // Check if payment is expired
    if (payment.status === "EXPIRED" || payment.status === "FAILED") {
      console.log("⚠️ Payment expired or failed");
      return NextResponse.json(
        { success: false, error: "Pembayaran sudah kadaluarsa atau gagal" },
        { status: 400 }
      );
    }

    // Check expiry time if available
    if (payment.expiryTime && new Date(payment.expiryTime) < new Date()) {
      console.log("⚠️ Payment token expired");
      // Update payment status to expired
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { success: false, error: "Token pembayaran sudah kadaluarsa" },
        { status: 400 }
      );
    }

    console.log("✅ Token validated successfully");

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.midtransOrderId,
        amount: payment.amount,
        status: payment.status,
        booking: payment.booking ? {
          id: payment.booking.id,
          bookingCode: payment.booking.bookingCode,
          propertyName: payment.booking.property?.name,
          roomNumber: payment.booking.room?.roomNumber,
          checkInDate: payment.booking.checkInDate?.toISOString(),
          checkOutDate: payment.booking.checkOutDate?.toISOString(),
        } : null,
      },
    });

  } catch (error: any) {
    console.error("❌ Error validating payment token:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memvalidasi pembayaran" },
      { status: 500 }
    );
  }
}
