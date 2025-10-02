import { BookingStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "../db/client";
import type { CustomerBookingSummary, CustomerProfileDetail } from "../types/customer";
import type { UserRole } from "../types/rbac";
import type { Result } from "../types/result";
import { ok, notFound, internalError } from "../types/result";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.DEPOSIT_PAID,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
];

export class CustomerRepository {
  static async getProfileByUserId(userId: string): Promise<Result<CustomerProfileDetail>> {
    try {
      const [user, totalBookings, activeBookings, pendingPayments] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            customerProfile: true,
            bookings: {
              orderBy: { createdAt: "desc" },
              take: 5,
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                room: {
                  select: {
                    id: true,
                    roomType: true,
                  },
                },
              },
            },
          },
        }),
        prisma.booking.count({ where: { userId } }),
        prisma.booking.count({
          where: {
            userId,
            status: {
              in: ACTIVE_BOOKING_STATUSES,
            },
          },
        }),
        prisma.payment.count({
          where: {
            userId,
            status: PaymentStatus.PENDING,
          },
        }),
      ]);

      if (!user || user.role !== "CUSTOMER") {
        return notFound("Customer not found");
      }

      const recentBookings: CustomerBookingSummary[] = user.bookings.map((booking) => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        propertyId: booking.propertyId,
        propertyName: booking.property?.name ?? null,
        roomId: booking.roomId,
        roomType: booking.room?.roomType ?? null,
        status: booking.status,
        checkInDate: booking.checkInDate,
        createdAt: booking.createdAt,
        totalAmount: Number(booking.totalAmount),
      }));

      return ok({
        id: user.id,
  role: user.role as UserRole,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        image: user.image,
        memberSince: user.createdAt,
        address: {
          provinceCode: user.provinceCode,
          provinceName: user.provinceName,
          regencyCode: user.regencyCode,
          regencyName: user.regencyName,
          districtCode: user.districtCode,
          districtName: user.districtName,
          streetAddress: user.streetAddress,
        },
        profile: user.customerProfile
          ? {
              dateOfBirth: user.customerProfile.dateOfBirth,
              gender: user.customerProfile.gender,
              emergencyContact: user.customerProfile.emergencyContact,
              emergencyPhone: user.customerProfile.emergencyPhone,
              status: user.customerProfile.status,
              institutionName: user.customerProfile.institutionName,
            }
          : null,
        stats: {
          totalBookings,
          activeBookings,
          pendingPayments,
        },
        recentBookings,
      });
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      return internalError("Failed to load customer profile");
    }
  }
}