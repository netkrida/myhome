/**
 * Tier-2: Cleanup Expired Bookings Service
 * Application service untuk cleanup booking dan payment yang expired
 * 
 * Orchestrates:
 * - Expire Payment PENDING yang melewati expiryTime
 * - Delete Booking UNPAID yang:
 *   1. Punya Payment EXPIRED, atau
 *   2. Tidak punya Payment dan melewati grace period
 * - Update Room.isAvailable = true
 * - Recalculate Property.availableRooms
 * 
 * Semua operasi dalam Prisma transaction untuk data consistency
 */

import { prisma } from "@/server/db/client";
import type { Result } from "@/server/types/result";
import { ok, internalError } from "@/server/types/result";

/**
 * Report hasil cleanup
 */
export interface CleanupReport {
  executedAt: string;
  graceMinutes: number;
  expiredPaymentsCount: number;
  deletedBookingsCount: number;
  deletedBookingIds: string[];
}

/**
 * Service untuk cleanup expired bookings dan payments
 */
export class CleanupExpiredBookingsService {
  
  /**
   * Execute cleanup process
   * 
   * @param graceMinutes - Grace period dalam menit untuk booking tanpa payment (default: 30)
   * @returns Result dengan CleanupReport
   */
  static async execute(graceMinutes: number = 30): Promise<Result<CleanupReport>> {
    try {
      const now = new Date();
      const graceThreshold = new Date(now.getTime() - graceMinutes * 60 * 1000);

      // Execute dalam transaction untuk atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Step 1: Expire Payment PENDING yang melewati expiryTime
        const expiredPaymentsResult = await tx.payment.updateMany({
          where: {
            status: "PENDING",
            expiryTime: {
              lt: now,
            },
          },
          data: {
            status: "EXPIRED",
            updatedAt: now,
          },
        });

        // Step 2: Find Booking UNPAID yang harus dihapus
        // Kriteria:
        // 1. Status = UNPAID
        // 2. Punya Payment EXPIRED ATAU tidak punya Payment dan createdAt < graceThreshold
        const bookingsToDelete = await tx.booking.findMany({
          where: {
            status: "UNPAID",
            OR: [
              // Kriteria 1: Punya Payment EXPIRED
              {
                payments: {
                  some: {
                    status: "EXPIRED",
                  },
                },
              },
              // Kriteria 2: Tidak punya Payment dan melewati grace period
              {
                AND: [
                  {
                    payments: {
                      none: {},
                    },
                  },
                  {
                    createdAt: {
                      lt: graceThreshold,
                    },
                  },
                ],
              },
            ],
          },
          select: {
            id: true,
            roomId: true,
            propertyId: true,
          },
        });

        const deletedBookingIds: string[] = [];
        const roomsToUpdate = new Set<string>();
        const propertiesToUpdate = new Set<string>();

        // Step 3: Delete bookings dan track rooms/properties yang perlu diupdate
        for (const booking of bookingsToDelete) {
          // Delete booking (cascade akan delete payments juga)
          await tx.booking.delete({
            where: { id: booking.id },
          });

          deletedBookingIds.push(booking.id);
          roomsToUpdate.add(booking.roomId);
          propertiesToUpdate.add(booking.propertyId);
        }

        // Step 4: Update Room.isAvailable = true untuk rooms yang terlibat
        if (roomsToUpdate.size > 0) {
          await tx.room.updateMany({
            where: {
              id: {
                in: Array.from(roomsToUpdate),
              },
            },
            data: {
              isAvailable: true,
              updatedAt: now,
            },
          });
        }

        // Step 5: Recalculate Property.availableRooms untuk properties yang terlibat
        for (const propertyId of propertiesToUpdate) {
          // Hitung jumlah room yang available
          const availableCount = await tx.room.count({
            where: {
              propertyId,
              isAvailable: true,
            },
          });

          // Update property
          await tx.property.update({
            where: { id: propertyId },
            data: {
              availableRooms: availableCount,
              updatedAt: now,
            },
          });
        }

        return {
          expiredPaymentsCount: expiredPaymentsResult.count,
          deletedBookingsCount: bookingsToDelete.length,
          deletedBookingIds,
        };
      });

      // Build report
      const report: CleanupReport = {
        executedAt: now.toISOString(),
        graceMinutes,
        expiredPaymentsCount: result.expiredPaymentsCount,
        deletedBookingsCount: result.deletedBookingsCount,
        deletedBookingIds: result.deletedBookingIds,
      };

      return ok(report);
    } catch (error) {
      console.error("[CleanupExpiredBookings] Error:", error);
      return internalError(
        error instanceof Error ? error.message : "Failed to cleanup expired bookings"
      );
    }
  }
}

