import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { BookingStatus, PaymentStatus } from "@/server/types/booking";

/**
 * GET /api/cron/expire/bookings
 * Cron job to auto-expire UNPAID bookings with expired payments
 * 
 * This endpoint should be called periodically (e.g., every 5-10 minutes) by:
 * - Vercel Cron Jobs
 * - External cron service (e.g., cron-job.org)
 * - GitHub Actions scheduled workflow
 * 
 * Flow:
 * 1. Find all UNPAID bookings
 * 2. Check if their payments are expired
 * 3. Update booking status to EXPIRED
 * 4. Free up the room for other bookings
 * 
 * Security:
 * - Should be protected with CRON_SECRET in production
 * - Or use Vercel Cron Jobs with built-in authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Find UNPAID bookings with expired payments
    const unpaidBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.UNPAID,
        payments: {
          some: {
            status: {
              in: [PaymentStatus.PENDING, PaymentStatus.EXPIRED]
            },
            expiryTime: {
              lt: now
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    console.log(`Found ${unpaidBookings.length} UNPAID bookings with expired payments`);

    // Update bookings to EXPIRED
    const expiredBookingIds = unpaidBookings.map(b => b.id);
    
    if (expiredBookingIds.length > 0) {
      // Update booking status
      await prisma.booking.updateMany({
        where: {
          id: {
            in: expiredBookingIds
          }
        },
        data: {
          status: BookingStatus.EXPIRED,
          paymentStatus: PaymentStatus.EXPIRED
        }
      });

      // Update payment status
      await prisma.payment.updateMany({
        where: {
          bookingId: {
            in: expiredBookingIds
          },
          status: PaymentStatus.PENDING
        },
        data: {
          status: PaymentStatus.EXPIRED
        }
      });

      console.log(`Expired ${expiredBookingIds.length} bookings:`, expiredBookingIds);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${unpaidBookings.length} expired bookings`,
      expiredCount: expiredBookingIds.length,
      expiredBookingIds,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error("Error in cron job /api/cron/expire/bookings:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

