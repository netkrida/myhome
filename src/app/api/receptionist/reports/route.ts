/**
 * GET /api/receptionist/reports
 * Get booking reports for receptionist's assigned property
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { ReceptionistRepository } from "@/server/repositories/adminkos/receptionist.repository";
import { prisma } from "@/server/db";
import { format, differenceInDays, addDays, addWeeks, addMonths, addYears } from "date-fns";
import type { BookingReportItem, BookingReportResponse, BookingReportFilters } from "@/server/types/report";
import { LeaseType } from "@/server/types/booking";

export const runtime = "nodejs";

// Calculate checkout date based on lease type
function calculateCheckOutDate(checkInDate: Date, leaseType: string): Date {
  switch (leaseType) {
    case LeaseType.DAILY:
      return addDays(checkInDate, 1);
    case LeaseType.WEEKLY:
      return addWeeks(checkInDate, 1);
    case LeaseType.MONTHLY:
      return addMonths(checkInDate, 1);
    case LeaseType.QUARTERLY:
      return addMonths(checkInDate, 3);
    case LeaseType.YEARLY:
      return addYears(checkInDate, 1);
    default:
      return addMonths(checkInDate, 1);
  }
}

// Translate lease type to Indonesian
function translateLeaseType(leaseType: string): string {
  switch (leaseType) {
    case LeaseType.DAILY:
      return "Harian";
    case LeaseType.WEEKLY:
      return "Mingguan";
    case LeaseType.MONTHLY:
      return "Bulanan";
    case LeaseType.QUARTERLY:
      return "3 Bulan";
    case LeaseType.YEARLY:
      return "Tahunan";
    default:
      return leaseType;
  }
}

// Translate status to Indonesian
function translateStatus(status: string): string {
  switch (status) {
    case "UNPAID":
      return "Belum Bayar";
    case "DEPOSIT_PAID":
      return "DP Dibayar";
    case "CONFIRMED":
      return "Terkonfirmasi";
    case "CHECKED_IN":
      return "Sudah Check-in";
    case "COMPLETED":
      return "Selesai";
    case "CANCELLED":
      return "Dibatalkan";
    case "EXPIRED":
      return "Kadaluarsa";
    default:
      return status;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "RECEPTIONIST") {
      return NextResponse.json(
        { success: false, error: "Only receptionist can access this endpoint" },
        { status: 403 }
      );
    }

    // Get receptionist's assigned property
    const receptionistResult = await ReceptionistRepository.findProfileByUserId(user.id);
    if (!receptionistResult.success) {
      return NextResponse.json(
        { success: false, error: "Failed to get receptionist profile" },
        { status: 500 }
      );
    }

    const { propertyId } = receptionistResult.data;
    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "Receptionist not assigned to any property" },
        { status: 403 }
      );
    }

    // Parse query params for filters
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || undefined;
    const leaseType = searchParams.get("leaseType") || undefined;
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;

    // Build where clause
    const where: any = {
      propertyId,
      status: {
        notIn: ["CANCELLED", "EXPIRED", "UNPAID"] // Exclude cancelled, expired, and unpaid bookings
      }
    };

    if (status) {
      where.status = status;
    }

    if (leaseType) {
      where.leaseType = leaseType;
    }

    if (dateFrom || dateTo) {
      where.checkInDate = {};
      if (dateFrom) {
        where.checkInDate.gte = dateFrom;
      }
      if (dateTo) {
        where.checkInDate.lte = dateTo;
      }
    }

    // Fetch bookings with user and room data
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        room: {
          select: {
            roomNumber: true,
            roomType: true,
          }
        }
      },
      orderBy: {
        checkInDate: "desc"
      }
    });

    const now = new Date();

    // Map to report items
    const reports: BookingReportItem[] = bookings.map(booking => {
      const checkOutDate = booking.checkOutDate || calculateCheckOutDate(booking.checkInDate, booking.leaseType);
      const leaseDuration = differenceInDays(checkOutDate, booking.checkInDate);
      
      // Calculate remaining days (only for active bookings)
      let remainingDays = 0;
      if (booking.status === "CHECKED_IN" || booking.status === "CONFIRMED" || booking.status === "DEPOSIT_PAID") {
        remainingDays = Math.max(0, differenceInDays(checkOutDate, now));
      }

      return {
        bookingCode: booking.bookingCode,
        customerName: booking.user?.name || "Unknown",
        customerPhone: booking.user?.phoneNumber || null,
        customerEmail: booking.user?.email || null,
        roomNumber: booking.room?.roomNumber || "Unknown",
        roomType: booking.room?.roomType || "Unknown",
        status: booking.status,
        checkInDate: booking.checkInDate,
        checkOutDate: checkOutDate,
        actualCheckInAt: booking.actualCheckInAt,
        actualCheckOutAt: booking.actualCheckOutAt,
        leaseType: booking.leaseType,
        leaseDuration,
        remainingDays,
        totalAmount: Number(booking.totalAmount),
        createdAt: booking.createdAt,
      };
    });

    // Calculate summary
    const summary = {
      total: reports.length,
      checkedIn: reports.filter(r => r.status === "CHECKED_IN").length,
      checkedOut: reports.filter(r => r.status === "COMPLETED").length,
      confirmed: reports.filter(r => r.status === "CONFIRMED").length,
      depositPaid: reports.filter(r => r.status === "DEPOSIT_PAID").length,
    };

    const response: BookingReportResponse = {
      reports,
      summary,
      generatedAt: now,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error in GET /api/receptionist/reports:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
