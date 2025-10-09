import { NextRequest, NextResponse } from "next/server";
import { PaymentAPI } from "@/server/api/payment.api";
import { auth } from "@/server/auth";
import { createPaymentSchema } from "@/server/schemas/booking.schemas";
import { ZodError } from "zod";

/**
 * POST /api/payments/create
 * Create payment token for a booking
 * 
 * Request body:
 * {
 *   "bookingId": "string",
 *   "paymentType": "DEPOSIT" | "FULL"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "token": "string",
 *     "redirectUrl": "string",
 *     "orderId": "string"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Call payment API
    const result = await PaymentAPI.createPaymentToken({
      bookingId: validatedData.bookingId,
      type: validatedData.paymentType
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: any) {
    console.error("POST /api/payments/create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

