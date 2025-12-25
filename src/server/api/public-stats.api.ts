import { prisma } from "../db/client";
import { PropertyRepository } from "../repositories/global/property.repository";
import { UserRepository } from "../repositories/user.repository";
import { PropertyStatus } from "@prisma/client";
import { ok, internalError } from "../types/result";
import type { Result } from "../types/result";

export interface PublicLandingStatsDTO {
    totalProperties: number;
    activeUsers: number;
    totalCities: number;
}

/**
 * Tier-2: Public Stats Application Services
 * Provides non-sensitive statistics for landing/about pages
 */
export class PublicStatsAPI {
    /**
     * Get statistics for the landing/about page
     * Publicly accessible, no auth required
     */
    static async getLandingStats(): Promise<Result<PublicLandingStatsDTO>> {
        try {
            // Execute relevant counts in parallel
            const [propertyStats, userStats, uniqueRegencies] = await Promise.all([
                // Get property stats (APPROVED only)
                prisma.property.count({
                    where: { status: PropertyStatus.APPROVED }
                }),

                // Get user stats (Active only)
                prisma.user.count({
                    where: { isActive: true }
                }),

                // Get count of unique cities/regencies where properties exist
                prisma.property.groupBy({
                    by: ['regencyName'],
                    where: { status: PropertyStatus.APPROVED },
                    _count: {
                        regencyName: true
                    }
                })
            ]);

            return ok({
                totalProperties: propertyStats,
                activeUsers: userStats,
                totalCities: uniqueRegencies.length,
            });
        } catch (error) {
            console.error("Error getting landing stats:", error);
            return internalError("Failed to retrieve public statistics");
        }
    }
}
