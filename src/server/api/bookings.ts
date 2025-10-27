import { BookingRepository } from "../repositories/adminkos/booking.repository";
import { RoomRepository } from "../repositories/adminkos/room.repository";
import { UserRepository } from "../repositories/user.repository";
import { ReceptionistRepository } from "../repositories/adminkos/receptionist.repository";
import { PaymentRepository } from "../repositories/adminkos/payment.repository";
import { LedgerRepository } from "../repositories/global/ledger.repository";
import { BookingService } from "../services/booking.service";
import {
  BookingStatus,
  PaymentStatus,
  PaymentType,
  type CheckInResponseDTO,
  type CheckOutResponseDTO,
  type DirectBookingRequestDTO,
  type DirectBookingResponseDTO,
  type UpdateBookingDatesDTO,
  type BookingDTO,
  type BookingListResponse,
  type BasicUserInfo,
} from "../types/booking";
import { UserRole, type UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import {
  ok,
  forbidden,
  notFound,
  conflict,
  internalError,
  badRequest,
} from "../types/result";

const OFFLINE_PAYMENT_PREFIX = "OFFLINE";

function buildOfflineOrderId(idempotencyKey?: string): string {
  if (idempotencyKey) {
    const sanitized = idempotencyKey.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 24);
    return `${OFFLINE_PAYMENT_PREFIX}-${sanitized}`;
  }

  const random = Math.random().toString(36).slice(-6).toUpperCase();
  return `${OFFLINE_PAYMENT_PREFIX}-${Date.now()}-${random}`;
}

export class BookingsApplication {
  static async listForReceptionist(
    filters: { status?: BookingStatus; page?: number; limit?: number; search?: string },
    currentUser: UserContext
  ): Promise<Result<BookingListResponse>> {
    if (currentUser.role !== UserRole.RECEPTIONIST) {
      return forbidden("Hanya resepsionis yang dapat mengakses data booking");
    }

    const receptionistResult = await ReceptionistRepository.findProfileByUserId(currentUser.id);
    if (!receptionistResult.success) {
      return {
        success: false,
        error: receptionistResult.error,
        statusCode: receptionistResult.statusCode ?? 500,
      };
    }

    const { propertyId } = receptionistResult.data;
    if (!propertyId) {
      return forbidden("Resepsionis belum ditugaskan ke properti mana pun");
    }

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 50;

    const bookingsResult = await BookingRepository.getList({
      propertyId,
      status: filters.status,
      page,
      limit,
      search: filters.search,
    });

    return bookingsResult;
  }

  static async checkIn(bookingId: string, currentUser: UserContext): Promise<Result<CheckInResponseDTO>> {
    if (currentUser.role !== UserRole.RECEPTIONIST) {
      return forbidden("Hanya resepsionis yang dapat melakukan check-in");
    }

    const booking = await BookingRepository.findByIdWithPropertyAndRoom(bookingId);
    if (!booking) {
      return notFound("Booking tidak ditemukan");
    }

    const receptionistResult = await ReceptionistRepository.findProfileByUserId(currentUser.id);
    if (!receptionistResult.success) {
      return forbidden("Profil resepsionis tidak valid");
    }

    const receptionistProfile = receptionistResult.data;
    if (!receptionistProfile.propertyId || receptionistProfile.propertyId !== booking.propertyId) {
      return forbidden("Resepsionis tidak memiliki akses ke properti ini");
    }

    const rule = BookingService.ruleCanCheckIn(booking);
    if (!rule.allowed) {
      return conflict(rule.reason || "Booking belum bisa check-in");
    }

    const overlaps = await BookingRepository.findActiveOverlaps({
      roomId: booking.roomId,
      range: { start: booking.checkInDate, end: booking.checkOutDate ?? null },
      excludeBookingId: booking.id,
      statuses: [BookingStatus.CHECKED_IN],
    });

    if (overlaps.length > 0) {
      return conflict("Kamar sudah terisi oleh tamu lain");
    }

    if (booking.status === BookingStatus.CHECKED_IN) {
      const fallbackCheckedInBy: BasicUserInfo = {
        id: booking.checkedInBy ?? currentUser.id,
        name: booking.checkedInByUser?.name ?? currentUser.name ?? undefined,
        email: booking.checkedInByUser?.email ?? currentUser.email,
      };

      return ok({
        bookingId: booking.id,
        status: booking.status,
        actualCheckInAt: booking.actualCheckInAt,
        checkedInBy: booking.checkedInByUser ?? fallbackCheckedInBy,
      });
    }

    const updated = await BookingRepository.updateForCheckIn({
      id: booking.id,
      checkedInBy: currentUser.id,
      actualCheckInAt: new Date(),
    });

    if (!updated) {
      return internalError("Gagal memperbarui status check-in");
    }

    const defaultCheckedInBy: BasicUserInfo = {
      id: currentUser.id,
      name: currentUser.name ?? undefined,
      email: currentUser.email,
    };

    return ok({
      bookingId: updated.id,
      status: updated.status,
      actualCheckInAt: updated.actualCheckInAt,
      checkedInBy: updated.checkedInByUser ?? defaultCheckedInBy,
    });
  }

  static async checkOut(bookingId: string, currentUser: UserContext): Promise<Result<CheckOutResponseDTO>> {
    if (currentUser.role !== UserRole.RECEPTIONIST) {
      return forbidden("Hanya resepsionis yang dapat melakukan check-out");
    }

    const booking = await BookingRepository.findByIdWithPropertyAndRoom(bookingId);
    if (!booking) {
      return notFound("Booking tidak ditemukan");
    }

    const receptionistResult = await ReceptionistRepository.findProfileByUserId(currentUser.id);
    if (!receptionistResult.success) {
      return forbidden("Profil resepsionis tidak valid");
    }

    const receptionistProfile = receptionistResult.data;
    if (!receptionistProfile.propertyId || receptionistProfile.propertyId !== booking.propertyId) {
      return forbidden("Resepsionis tidak memiliki akses ke properti ini");
    }

    const rule = BookingService.ruleCanCheckOut(booking);
    if (!rule.allowed) {
      return conflict(rule.reason || "Booking belum bisa check-out");
    }

    if (booking.status === BookingStatus.COMPLETED) {
      const fallbackCheckedOutBy: BasicUserInfo = {
        id: booking.checkedOutBy ?? currentUser.id,
        name: booking.checkedOutByUser?.name ?? currentUser.name ?? undefined,
        email: booking.checkedOutByUser?.email ?? currentUser.email,
      };

      return ok({
        bookingId: booking.id,
        status: booking.status,
        actualCheckOutAt: booking.actualCheckOutAt,
        checkedOutBy: booking.checkedOutByUser ?? fallbackCheckedOutBy,
      });
    }

    const updated = await BookingRepository.updateForCheckOut({
      id: booking.id,
      checkedOutBy: currentUser.id,
      actualCheckOutAt: new Date(),
    });

    if (!updated) {
      return internalError("Gagal memperbarui status check-out");
    }

    const defaultCheckedOutBy: BasicUserInfo = {
      id: currentUser.id,
      name: currentUser.name ?? undefined,
      email: currentUser.email,
    };

    return ok({
      bookingId: updated.id,
      status: updated.status,
      actualCheckOutAt: updated.actualCheckOutAt,
      checkedOutBy: updated.checkedOutByUser ?? defaultCheckedOutBy,
    });
  }

  static async getReceptionistBookingByCode(bookingCode: string, currentUser: UserContext): Promise<Result<BookingDTO>> {
    if (currentUser.role !== UserRole.RECEPTIONIST) {
      return forbidden("Hanya resepsionis yang dapat mengakses booking ini");
    }

    const receptionistResult = await ReceptionistRepository.findProfileByUserId(currentUser.id);
    if (!receptionistResult.success) {
      return forbidden("Profil resepsionis tidak valid");
    }

    const bookingResult = await BookingRepository.getByBookingCode(bookingCode);
    if (!bookingResult.success) {
      return bookingResult;
    }

    const booking = bookingResult.data;
    if (!receptionistResult.data.propertyId || receptionistResult.data.propertyId !== booking.propertyId) {
      return forbidden("Resepsionis tidak memiliki akses ke booking ini");
    }

    return ok(booking);
  }

  static async createDirectBooking(payload: DirectBookingRequestDTO, currentUser: UserContext): Promise<Result<DirectBookingResponseDTO>> {
    if (currentUser.role !== UserRole.RECEPTIONIST) {
      return forbidden("Hanya resepsionis yang dapat membuat booking langsung");
    }

    const receptionistResult = await ReceptionistRepository.findProfileByUserId(currentUser.id);
    if (!receptionistResult.success) {
      return forbidden("Profil resepsionis tidak valid");
    }

    const receptionistProfile = receptionistResult.data;
    if (!receptionistProfile.propertyId || receptionistProfile.propertyId !== payload.propertyId) {
      return forbidden("Resepsionis tidak memiliki akses ke properti ini");
    }

    if (!receptionistProfile.adminKosId) {
      return internalError("AdminKos untuk properti ini tidak ditemukan");
    }

    const room = await RoomRepository.findPrismaRoomById(payload.roomId);
    if (!room || room.propertyId !== payload.propertyId) {
      return notFound("Kamar tidak ditemukan untuk properti ini");
    }

    const customerResult = await UserRepository.findOrCreateCustomer(payload.customer);
    if (!customerResult.success) {
      return customerResult;
    }

    const customer = customerResult.data;

    const ledgerAccount = await LedgerRepository.getAccountById(payload.payment.ledgerAccountId);
    if (!ledgerAccount || ledgerAccount.adminKosId !== receptionistProfile.adminKosId) {
      return badRequest("Akun pembukuan tidak valid untuk properti ini");
    }

    if (ledgerAccount.type !== "INCOME") {
      return badRequest("Hanya akun pemasukan yang dapat digunakan untuk pembayaran");
    }

    if (ledgerAccount.isArchived) {
      return badRequest("Akun pembukuan ini sudah diarsipkan");
    }

    const checkInDate = payload.checkInDate instanceof Date ? payload.checkInDate : new Date(payload.checkInDate);
    const resolvedCheckOutDate = payload.checkOutDate ? new Date(payload.checkOutDate) : BookingService.calculateCheckOutDate(checkInDate, payload.leaseType);

    const overlaps = await BookingRepository.findActiveOverlaps({
      roomId: room.id,
      range: { start: checkInDate, end: resolvedCheckOutDate },
    });

    if (overlaps.length > 0) {
      return conflict("Rentang tanggal bertabrakan dengan booking lain");
    }

    const calculation = BookingService.calculateBookingAmount(room, payload.leaseType, checkInDate);
    const orderId = buildOfflineOrderId(payload.idempotencyKey);

    if (payload.idempotencyKey) {
      const existingPayment = await PaymentRepository.getByOrderId(orderId);
      if (existingPayment.success) {
        const existingBooking = await BookingRepository.getById(existingPayment.data.bookingId);
        if (existingBooking.success) {
          return ok({
            bookingId: existingBooking.data.id,
            bookingCode: existingBooking.data.bookingCode,
            status: existingBooking.data.status,
            payment: {
              id: existingPayment.data.id,
              status: existingPayment.data.status,
            },
          });
        }
      } else if (!existingPayment.success && existingPayment.statusCode !== 404) {
        return internalError(existingPayment.error.message || "Gagal memeriksa status idempotensi");
      }
    }

    const paymentMode = payload.payment.mode;
    const isFullPayment = paymentMode === "FULL";
    const paymentType = isFullPayment ? PaymentType.FULL : PaymentType.DEPOSIT;

    let depositAmount = calculation.depositAmount;
    if (!isFullPayment) {
      if (!depositAmount || depositAmount <= 0) {
        return badRequest("Kamar ini tidak memiliki konfigurasi deposit");
      }
    } else {
      depositAmount = calculation.depositAmount || undefined;
    }

    const bookingStatus = isFullPayment ? BookingStatus.CONFIRMED : BookingStatus.DEPOSIT_PAID;
    const paymentAmount = isFullPayment ? calculation.totalAmount : depositAmount!;

    const transactionResult = await BookingRepository.createWithPaymentTx({
      booking: {
        bookingCode: BookingService.generateBookingCode(),
        userId: customer.id,
        propertyId: payload.propertyId,
        roomId: payload.roomId,
        leaseType: payload.leaseType,
        checkInDate,
        checkOutDate: resolvedCheckOutDate,
        totalAmount: calculation.totalAmount,
        depositAmount,
        status: bookingStatus,
        paymentStatus: PaymentStatus.SUCCESS,
      },
      payment: {
        userId: customer.id,
        paymentType,
        paymentMethod: payload.payment.method,
        amount: paymentAmount,
        status: PaymentStatus.SUCCESS,
        midtransOrderId: orderId,
        transactionTime: new Date(),
      },
      ledgerEntry: {
        adminKosId: ledgerAccount.adminKosId,
        accountId: ledgerAccount.id,
        propertyId: payload.propertyId,
        amount: paymentAmount,
        createdBy: currentUser.id,
        note: `Pembayaran offline ${isFullPayment ? "lunas" : "deposit"} melalui ${payload.payment.method}`,
      },
    });

    if (!transactionResult.success) {
      if (transactionResult.error.code === "RESOURCE_ALREADY_EXISTS") {
        return conflict(transactionResult.error.message);
      }
      return transactionResult;
    }

    const { booking: savedBooking, payment } = transactionResult.data;

    return ok({
      bookingId: savedBooking.id,
      bookingCode: savedBooking.bookingCode,
      status: savedBooking.status,
      payment: {
        id: payment.id,
        status: payment.status,
      },
    }, 201);
  }

  static async updatePlannedDates(bookingId: string, input: UpdateBookingDatesDTO, currentUser: UserContext): Promise<Result<BookingDTO>> {
    if (currentUser.role !== UserRole.ADMINKOS) {
      return forbidden("Hanya AdminKos yang dapat memperbarui tanggal booking");
    }

    const booking = await BookingRepository.findByIdWithPropertyAndRoom(bookingId);
    if (!booking) {
      return notFound("Booking tidak ditemukan");
    }

    if (!booking.property?.ownerId || booking.property.ownerId !== currentUser.id) {
      return forbidden("AdminKos tidak memiliki akses ke booking ini");
    }

    if (booking.status === BookingStatus.CHECKED_IN || booking.status === BookingStatus.COMPLETED) {
      return conflict("Booking yang sudah check-in tidak dapat diubah");
    }

    const checkInDate = input.checkInDate instanceof Date ? input.checkInDate : new Date(input.checkInDate);
    const checkOutDate = input.checkOutDate ? new Date(input.checkOutDate) : undefined;

    const overlaps = await BookingRepository.findActiveOverlaps({
      roomId: booking.roomId,
      range: { start: checkInDate, end: checkOutDate ?? booking.checkOutDate ?? null },
      excludeBookingId: booking.id,
    });

    if (overlaps.length > 0) {
      return conflict("Rentang tanggal bertabrakan dengan booking lain");
    }

    const updated = await BookingRepository.updateDates({
      id: booking.id,
      checkInDate,
      checkOutDate,
    });

    if (!updated) {
      return internalError("Gagal memperbarui tanggal booking");
    }

    return ok(updated);
  }
}
