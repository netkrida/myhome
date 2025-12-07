/**
 * GET /api/receptionist/reports/export
 * Export booking reports to CSV/Excel for receptionist's assigned property
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { ReceptionistRepository } from "@/server/repositories/adminkos/receptionist.repository";
import { prisma } from "@/server/db";

import { format, differenceInDays, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { LeaseType } from "@/server/types/booking";
import ExcelJS from "exceljs";

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
      return "Selesai (Checkout)";
    case "CANCELLED":
      return "Dibatalkan";
    case "EXPIRED":
      return "Kadaluarsa";
    default:
      return status;
  }
}

// Escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

    const { propertyId, propertyName } = receptionistResult.data;
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
        notIn: ["CANCELLED", "EXPIRED", "UNPAID"]
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
        },
        property: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        checkInDate: "desc"
      }
    });

    const now = new Date();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Booking");

    // Define columns
    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Kode Booking", key: "bookingCode", width: 18 },
      { header: "Nama Customer", key: "customerName", width: 22 },
      { header: "No. HP", key: "customerPhone", width: 15 },
      { header: "Email", key: "customerEmail", width: 22 },
      { header: "No. Kamar", key: "roomNumber", width: 12 },
      { header: "Tipe Kamar", key: "roomType", width: 14 },
      { header: "Status", key: "status", width: 16 },
      { header: "Tanggal Check-in", key: "checkInDate", width: 16 },
      { header: "Tanggal Check-out", key: "checkOutDate", width: 16 },
      { header: "Actual Check-in", key: "actualCheckInAt", width: 18 },
      { header: "Actual Check-out", key: "actualCheckOutAt", width: 18 },
      { header: "Masa Sewa", key: "leaseType", width: 12 },
      { header: "Durasi (Hari)", key: "leaseDuration", width: 12 },
      { header: "Sisa Waktu (Hari)", key: "remainingDays", width: 16 },
      { header: "Total Harga", key: "totalAmount", width: 16 },
      { header: "Tanggal Booking", key: "createdAt", width: 20 },
    ];

    // Add rows
    bookings.forEach((booking, index) => {
      const checkOutDate = booking.checkOutDate || calculateCheckOutDate(booking.checkInDate, booking.leaseType);
      const leaseDuration = differenceInDays(checkOutDate, booking.checkInDate);
      let remainingDays = 0;
      if (booking.status === "CHECKED_IN" || booking.status === "CONFIRMED" || booking.status === "DEPOSIT_PAID") {
        remainingDays = Math.max(0, differenceInDays(checkOutDate, now));
      }
      sheet.addRow({
        no: index + 1,
        bookingCode: booking.bookingCode,
        customerName: booking.user?.name || "-",
        customerPhone: booking.user?.phoneNumber || "-",
        customerEmail: booking.user?.email || "-",
        roomNumber: booking.room?.roomNumber || "-",
        roomType: booking.room?.roomType || "-",
        status: translateStatus(booking.status),
        checkInDate: format(booking.checkInDate, "dd/MM/yyyy", { locale: localeId }),
        checkOutDate: format(checkOutDate, "dd/MM/yyyy", { locale: localeId }),
        actualCheckInAt: booking.actualCheckInAt ? format(booking.actualCheckInAt, "dd/MM/yyyy HH:mm", { locale: localeId }) : "-",
        actualCheckOutAt: booking.actualCheckOutAt ? format(booking.actualCheckOutAt, "dd/MM/yyyy HH:mm", { locale: localeId }) : "-",
        leaseType: translateLeaseType(booking.leaseType),
        leaseDuration,
        remainingDays,
        totalAmount: Number(booking.totalAmount),
        createdAt: format(booking.createdAt, "dd/MM/yyyy HH:mm", { locale: localeId }),
      });
    });

    // Add summary rows
    const summaryData = {
      total: bookings.length,
      checkedIn: bookings.filter(b => b.status === "CHECKED_IN").length,
      completed: bookings.filter(b => b.status === "COMPLETED").length,
      confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
      depositPaid: bookings.filter(b => b.status === "DEPOSIT_PAID").length,
    };

    sheet.addRow([]);
    sheet.addRow(["RINGKASAN"]);
    sheet.addRow(["Total Booking", summaryData.total]);
    sheet.addRow(["Sudah Check-in", summaryData.checkedIn]);
    sheet.addRow(["Selesai (Checkout)", summaryData.completed]);
    sheet.addRow(["Terkonfirmasi", summaryData.confirmed]);
    sheet.addRow(["DP Dibayar", summaryData.depositPaid]);
    sheet.addRow([]);
    sheet.addRow([`Laporan dibuat: ${format(now, "dd MMMM yyyy HH:mm", { locale: localeId })}`]);
    sheet.addRow([`Properti: ${propertyName || "Unknown"}`]);

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    sheet.columns.forEach((col) => {
      col.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    });

    // Format totalAmount as currency
    sheet.getColumn("totalAmount").numFmt = '"Rp" #,##0';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = format(now, "yyyyMMdd_HHmmss");
    const filename = `laporan_booking_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/receptionist/reports/export:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
