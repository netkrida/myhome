import { LedgerRepository } from "@/server/repositories/global/ledger.repository";
/**
 * POST /api/adminkos/bookings/manual
 * Create manual booking by AdminKos
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { BookingRepository } from "@/server/repositories/adminkos/booking.repository";
import { PaymentRepository } from "@/server/repositories/adminkos/payment.repository";
import { RoomRepository } from "@/server/repositories/adminkos/room.repository";
import { PropertyRepository } from "@/server/repositories/global/property.repository";
import { BookingService } from "@/server/services/booking.service";
import { PaymentService } from "@/server/services/payment.service";
import { BookingStatus, PaymentStatus, PaymentType, LeaseType } from "@/server/types/booking";
import { AdminKosLedgerAPI } from "@/server/api/adminkos.ledger";
import { z } from "zod";

const manualBookingSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  roomId: z.string().cuid("Invalid room ID"),
  checkInDate: z.coerce.date(),
  leaseType: z.nativeEnum(LeaseType),
  depositOption: z.enum(["deposit", "full"]),
  accountId: z.string().cuid("Invalid account ID"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role
    if (userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Only AdminKos can create manual bookings" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = manualBookingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

  const { userId, roomId, checkInDate, leaseType, depositOption, accountId } = validationResult.data;
    // Validate accountId (must be a non-system account belonging to this AdminKos)
    const accountsResult = await AdminKosLedgerAPI.listAccounts();
    if (!accountsResult.success || !Array.isArray(accountsResult.data.accounts)) {
      return NextResponse.json({ success: false, error: "Gagal mengambil daftar akun" }, { status: 400 });
    }
    const validAccount = accountsResult.data.accounts.find((a: any) => a.id === accountId && !a.isSystem && !a.isArchived);
    if (!validAccount) {
      return NextResponse.json({ success: false, error: "Akun tidak valid atau tidak ditemukan" }, { status: 400 });
    }

    // Get room details
    const roomResult = await RoomRepository.getById(roomId);
    if (!roomResult.success) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }
    const room = roomResult.data!;

    // Verify that the room belongs to the AdminKos's property
    const property = await PropertyRepository.findById(room.propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.ownerId !== userContext.id) {
      return NextResponse.json(
        { success: false, error: "You can only create bookings for your own properties" },
        { status: 403 }
      );
    }

    // Check room availability
    const checkOutDate = BookingService.calculateCheckOutDate(checkInDate, leaseType);
    const existingBookingsResult = await BookingRepository.getBookingsForRoom(
      roomId,
      checkInDate,
      checkOutDate
    );

    if (!existingBookingsResult.success) {
      return NextResponse.json(
        { success: false, error: "Failed to check room availability" },
        { status: 500 }
      );
    }

    // Validate booking
    const validation = BookingService.validateBookingCreation(
      { userId, roomId, checkInDate, leaseType, depositOption },
      room,
      existingBookingsResult.data
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Calculate booking amounts
    const calculation = BookingService.calculateBookingAmount(
      room,
      leaseType,
      checkInDate
    );

    // Generate booking code
    const bookingCode = BookingService.generateBookingCode();

    // Determine payment amount
    const isDepositPayment = depositOption === "deposit" && calculation.depositAmount;
    const paymentAmount = isDepositPayment ? calculation.depositAmount! : calculation.totalAmount;
    const paymentType = isDepositPayment ? PaymentType.DEPOSIT : PaymentType.FULL;

    // Create booking with CONFIRMED status (langsung lunas)
    const createBookingResult = await BookingRepository.create({
      userId,
      roomId,
      bookingCode,
      propertyId: room.propertyId,
      checkInDate,
      checkOutDate,
      leaseType,
      totalAmount: calculation.totalAmount,
      depositAmount: calculation.depositAmount,
      paymentStatus: PaymentStatus.SUCCESS,
      status: BookingStatus.CONFIRMED,
      depositOption,
    });

    if (!createBookingResult.success) {
      return NextResponse.json(
        { success: false, error: createBookingResult.error },
        { status: createBookingResult.statusCode || 500 }
      );
    }

    const booking = createBookingResult.data!;

    // Create payment record (langsung sukses, masuk akun)
    const orderId = PaymentService.generateOrderId(booking.id, paymentType);
    const createPaymentResult = await PaymentRepository.create({
      bookingId: booking.id,
      userId: booking.userId,
      paymentType,
      midtransOrderId: orderId,
      amount: paymentAmount,
      status: PaymentStatus.SUCCESS,
      transactionTime: new Date(),
      accountId,
    });

    if (!createPaymentResult.success) {
      return NextResponse.json(
        { success: false, error: createPaymentResult.error },
        { status: createPaymentResult.statusCode || 500 }
      );
    }

    const payment = createPaymentResult.data!;


    // Validasi profileId sebelum membuat ledger entry
    if (!userContext.profileId) {
      return NextResponse.json({ success: false, error: "Akun AdminKos tidak valid" }, { status: 400 });
    }
    await LedgerRepository.createEntry(
      userContext.profileId,
      userContext.id,
      {
        accountId,
        direction: "IN",
        amount: paymentAmount,
        date: new Date(),
        note: `Booking manual ${booking.bookingCode} oleh admin`,
        refType: "PAYMENT",
        refId: payment.id,
        propertyId: property.id,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        totalAmount: booking.totalAmount,
        depositAmount: booking.depositAmount,
        paymentAmount,
        paymentType,
        paymentId: payment.id,
        orderId: payment.midtransOrderId,
      },
    });

  } catch (error) {
    console.error("Error creating manual booking:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

