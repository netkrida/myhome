/**
 * Advertisement Repository
 * Handles all database operations for advertisements
 */

import { db } from "@/server/db";
import type { AdvertisementDTO, PublicAdvertisementDTO } from "@/server/types/advertisement.types";
import { AdvertisementStatus } from "@/server/types/advertisement.types";
import type { AdvertisementSubmitInput, AdvertisementUpdateInput } from "@/server/schemas/advertisement.schema";

export class AdvertisementRepository {
  /**
   * Create new advertisement submission (AdminKos)
   */
  async createSubmission(
    data: AdvertisementSubmitInput,
    userId: string
  ): Promise<AdvertisementDTO> {
    const advertisement = await db.advertisement.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        linkUrl: data.linkUrl,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: AdvertisementStatus.PENDING,
        submittedBy: userId,
        submittedAt: new Date(),
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDTO(advertisement);
  }

  /**
   * Get advertisement by ID
   */
  async getById(id: string): Promise<AdvertisementDTO | null> {
    const advertisement = await db.advertisement.findUnique({
      where: { id },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return advertisement ? this.mapToDTO(advertisement) : null;
  }

  /**
   * Get all submissions by AdminKos user
   */
  async getBySubmitter(userId: string): Promise<AdvertisementDTO[]> {
    const advertisements = await db.advertisement.findMany({
      where: {
        submittedBy: userId,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ submittedAt: "desc" }],
    });

    return advertisements.map((ad) => this.mapToDTO(ad));
  }

  /**
   * Get pending advertisements (for SuperAdmin approval queue)
   */
  async getPendingAdvertisements(): Promise<AdvertisementDTO[]> {
    const advertisements = await db.advertisement.findMany({
      where: {
        status: AdvertisementStatus.PENDING,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ submittedAt: "asc" }],
    });

    return advertisements.map((ad) => this.mapToDTO(ad));
  }

  /**
   * Get approved but not placed advertisements (for SuperAdmin placement queue)
   */
  async getApprovedUnplacedAdvertisements(): Promise<AdvertisementDTO[]> {
    const advertisements = await db.advertisement.findMany({
      where: {
        status: AdvertisementStatus.APPROVED,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ reviewedAt: "asc" }],
    });

    return advertisements.map((ad) => this.mapToDTO(ad));
  }

  /**
   * Get placed advertisements grouped by layout slot
   */
  async getPlacedAdvertisements(): Promise<AdvertisementDTO[]> {
    const advertisements = await db.advertisement.findMany({
      where: {
        status: AdvertisementStatus.PLACED,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ layoutSlot: "asc" }, { sortOrder: "asc" }],
    });

    return advertisements.map((ad) => this.mapToDTO(ad));
  }

  /**
   * Get all advertisements (SuperAdmin overview)
   */
  async getAllAdvertisements(): Promise<AdvertisementDTO[]> {
    const advertisements = await db.advertisement.findMany({
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return advertisements.map((ad) => this.mapToDTO(ad));
  }

  /**
   * Approve advertisement
   */
  async approveAdvertisement(
    id: string,
    reviewerId: string
  ): Promise<AdvertisementDTO | null> {
    const advertisement = await db.advertisement.update({
      where: { id },
      data: {
        status: AdvertisementStatus.APPROVED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDTO(advertisement);
  }

  /**
   * Reject advertisement
   */
  async rejectAdvertisement(
    id: string,
    reviewerId: string,
    reason: string | null
  ): Promise<AdvertisementDTO | null> {
    const advertisement = await db.advertisement.update({
      where: { id },
      data: {
        status: AdvertisementStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        isActive: false,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDTO(advertisement);
  }

  /**
   * Place advertisement in layout
   */
  async placeAdvertisement(
    id: string,
    layoutSlot: number
  ): Promise<AdvertisementDTO | null> {
    const advertisement = await db.advertisement.update({
      where: { id },
      data: {
        status: AdvertisementStatus.PLACED,
        layoutSlot,
        placedAt: new Date(),
        isActive: true,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDTO(advertisement);
  }

  /**
   * Remove advertisement from layout (back to approved)
   */
  async removeFromLayout(id: string): Promise<AdvertisementDTO | null> {
    const advertisement = await db.advertisement.update({
      where: { id },
      data: {
        status: AdvertisementStatus.APPROVED,
        layoutSlot: null,
        placedAt: null,
        isActive: false,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDTO(advertisement);
  }

  /**
   * Update advertisement details (only if PENDING or APPROVED)
   */
  async updateAdvertisement(
    id: string,
    data: AdvertisementUpdateInput
  ): Promise<AdvertisementDTO | null> {
    const advertisement = await db.advertisement.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        ...(data.publicId !== undefined && { publicId: data.publicId }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDTO(advertisement);
  }

  /**
   * Toggle active status
   */
  async toggleActiveStatus(id: string, isActive: boolean): Promise<AdvertisementDTO | null> {
    const advertisement = await db.advertisement.update({
      where: { id },
      data: { isActive },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDTO(advertisement);
  }

  /**
   * Delete advertisement
   */
  async deleteAdvertisement(id: string): Promise<void> {
    await db.advertisement.delete({
      where: { id },
    });
  }

  /**
   * Get active placed advertisements for public display (specific layout slot)
   */
  async getPublicAdvertisementsBySlot(layoutSlot: number): Promise<PublicAdvertisementDTO[]> {
    const now = new Date();
    const advertisements = await db.advertisement.findMany({
      where: {
        status: AdvertisementStatus.PLACED,
        layoutSlot,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        publicId: true,
        linkUrl: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }],
    });

    return advertisements;
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDTO(advertisement: any): AdvertisementDTO {
    return {
      id: advertisement.id,
      title: advertisement.title,
      description: advertisement.description,
      imageUrl: advertisement.imageUrl,
      publicId: advertisement.publicId,
      linkUrl: advertisement.linkUrl,
      status: advertisement.status as AdvertisementStatus,
      submittedBy: advertisement.submittedBy,
      submittedByName: advertisement.submitter?.name || null,
      submittedAt: advertisement.submittedAt,
      reviewedBy: advertisement.reviewedBy,
      reviewedByName: advertisement.reviewer?.name || null,
      reviewedAt: advertisement.reviewedAt,
      rejectionReason: advertisement.rejectionReason,
      layoutSlot: advertisement.layoutSlot,
      placedAt: advertisement.placedAt,
      sortOrder: advertisement.sortOrder,
      isActive: advertisement.isActive,
      startDate: advertisement.startDate,
      endDate: advertisement.endDate,
      createdAt: advertisement.createdAt,
      updatedAt: advertisement.updatedAt,
    };
  }
}
