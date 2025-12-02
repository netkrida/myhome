/**
 * Advertisement Service
 * Business logic for advertisement management
 */

import { AdvertisementRepository } from "@/server/repositories/advertisement.repository";
import { ok, fail, ErrorCode } from "@/server/types/result";
import type { Result } from "@/server/types/result";
import { AdvertisementStatus } from "@/server/types/advertisement.types";
import type {
  AdvertisementSubmitInput,
  AdvertisementUpdateInput,
  AdvertisementApprovalInput,
  AdvertisementPlacementInput,
} from "@/server/schemas/advertisement.schema";
import type { AdvertisementDTO, PublicAdvertisementDTO } from "@/server/types/advertisement.types";

export class AdvertisementService {
  private repository: AdvertisementRepository;

  constructor() {
    this.repository = new AdvertisementRepository();
  }

  /**
   * Submit new advertisement (AdminKos)
   */
  async submitAdvertisement(
    data: AdvertisementSubmitInput,
    userId: string
  ): Promise<Result<AdvertisementDTO>> {
    try {
      console.log("📝 Submitting advertisement:", { title: data.title, userId });

      // Validate date range
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (end < start) {
          return fail({ code: ErrorCode.VALIDATION_ERROR, message: "Tanggal berakhir harus setelah tanggal mulai" });
        }
      }

      const advertisement = await this.repository.createSubmission(data, userId);

      console.log("✅ Advertisement submitted successfully:", advertisement.id);
      return ok(advertisement);
    } catch (error) {
      console.error("❌ Error submitting advertisement:", error);
      return fail({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Gagal mengajukan iklan",
      });
    }
  }

  /**
   * Get advertisement by ID
   */
  async getAdvertisementById(id: string): Promise<Result<AdvertisementDTO>> {
    try {
      const advertisement = await this.repository.getById(id);

      if (!advertisement) {
        return fail({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: "Iklan tidak ditemukan",
        });
      }

      return ok(advertisement);
    } catch (error) {
      console.error("❌ Error getting advertisement:", error);
      return fail({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Gagal mengambil data iklan",
      });
    }
  }

  /**
   * Get advertisements submitted by AdminKos
   */
  async getMyAdvertisements(userId: string): Promise<Result<AdvertisementDTO[]>> {
    try {
      const advertisements = await this.repository.getBySubmitter(userId);

      return ok(advertisements);
    } catch (error) {
      console.error("❌ Error getting my advertisements:", error);
      return fail({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Gagal mengambil data iklan",
      });
    }
  }

  /**
   * Get pending advertisements (SuperAdmin)
   */
  async getPendingAdvertisements(): Promise<Result<AdvertisementDTO[]>> {
    try {
      const advertisements = await this.repository.getPendingAdvertisements();

      return ok(advertisements);
    } catch (error) {
      console.error("❌ Error getting pending advertisements:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengambil data iklan pending" });
    }
  }

  /**
   * Get approved but not placed advertisements (SuperAdmin)
   */
  async getApprovedUnplacedAdvertisements(): Promise<Result<AdvertisementDTO[]>> {
    try {
      const advertisements = await this.repository.getApprovedUnplacedAdvertisements();

      return ok(advertisements);
    } catch (error) {
      console.error("❌ Error getting approved unplaced advertisements:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengambil data iklan approved" });
    }
  }

  /**
   * Get placed advertisements (SuperAdmin)
   */
  async getPlacedAdvertisements(): Promise<Result<AdvertisementDTO[]>> {
    try {
      const advertisements = await this.repository.getPlacedAdvertisements();

      return ok(advertisements);
    } catch (error) {
      console.error("❌ Error getting placed advertisements:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengambil data iklan terpasang" });
    }
  }

  /**
   * Get all advertisements (SuperAdmin)
   */
  async getAllAdvertisements(): Promise<Result<AdvertisementDTO[]>> {
    try {
      const advertisements = await this.repository.getAllAdvertisements();

      return ok(advertisements);
    } catch (error) {
      console.error("❌ Error getting all advertisements:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengambil data iklan" });
    }
  }

  /**
   * Approve or reject advertisement (SuperAdmin)
   */
  async reviewAdvertisement(
    id: string,
    data: AdvertisementApprovalInput,
    reviewerId: string
  ): Promise<Result<AdvertisementDTO>> {
    try {
      console.log("👀 Reviewing advertisement:", { id, action: data.action, reviewerId });

      const existing = await this.repository.getById(id);
      if (!existing) {
        return fail({ code: ErrorCode.RESOURCE_NOT_FOUND, message: "Iklan tidak ditemukan" });
      }

      if (existing.status !== AdvertisementStatus.PENDING) {
        return fail({ code: ErrorCode.BUSINESS_RULE_VIOLATION, message: "Iklan sudah direview sebelumnya" });
      }

      let advertisement: AdvertisementDTO | null;

      if (data.action === "APPROVE") {
        advertisement = await this.repository.approveAdvertisement(id, reviewerId);
        console.log("✅ Advertisement approved:", id);
      } else {
        advertisement = await this.repository.rejectAdvertisement(
          id,
          reviewerId,
          data.rejectionReason || null
        );
        console.log("❌ Advertisement rejected:", id);
      }

      if (!advertisement) {
        return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mereview iklan" });
      }

      return ok(advertisement);
    } catch (error) {
      console.error("❌ Error reviewing advertisement:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mereview iklan" });
    }
  }

  /**
   * Place advertisement in layout (SuperAdmin)
   */
  async placeAdvertisement(
    id: string,
    data: AdvertisementPlacementInput
  ): Promise<Result<AdvertisementDTO>> {
    try {
      console.log("📌 Placing advertisement:", { id, layoutSlot: data.layoutSlot });

      const existing = await this.repository.getById(id);
      if (!existing) {
        return fail({ code: ErrorCode.RESOURCE_NOT_FOUND, message: "Iklan tidak ditemukan" });
      }

      if (existing.status !== AdvertisementStatus.APPROVED) {
        return fail({ code: ErrorCode.BUSINESS_RULE_VIOLATION, message: "Iklan harus diapprove terlebih dahulu" });
      }

      const advertisement = await this.repository.placeAdvertisement(id, data.layoutSlot);

      if (!advertisement) {
        return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal menempatkan iklan" });
      }

      console.log("✅ Advertisement placed:", id);
      return ok(advertisement);
    } catch (error) {
      console.error("❌ Error placing advertisement:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal menempatkan iklan" });
    }
  }

  /**
   * Remove advertisement from layout (SuperAdmin)
   */
  async removeFromLayout(id: string): Promise<Result<AdvertisementDTO>> {
    try {
      console.log("🗑️ Removing advertisement from layout:", id);

      const existing = await this.repository.getById(id);
      if (!existing) {
        return fail({ code: ErrorCode.RESOURCE_NOT_FOUND, message: "Iklan tidak ditemukan" });
      }

      if (existing.status !== AdvertisementStatus.PLACED) {
        return fail({ code: ErrorCode.BUSINESS_RULE_VIOLATION, message: "Iklan tidak sedang terpasang" });
      }

      const advertisement = await this.repository.removeFromLayout(id);

      if (!advertisement) {
        return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal menghapus iklan dari layout" });
      }

      console.log("✅ Advertisement removed from layout:", id);
      return ok(advertisement);
    } catch (error) {
      console.error("❌ Error removing advertisement from layout:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal menghapus iklan dari layout" });
    }
  }

  /**
   * Update advertisement (AdminKos - only if PENDING or APPROVED)
   */
  async updateAdvertisement(
    id: string,
    data: AdvertisementUpdateInput,
    userId: string
  ): Promise<Result<AdvertisementDTO>> {
    try {
      console.log("✏️ Updating advertisement:", { id, userId });

      const existing = await this.repository.getById(id);
      if (!existing) {
        return fail({ code: ErrorCode.RESOURCE_NOT_FOUND, message: "Iklan tidak ditemukan" });
      }

      if (existing.submittedBy !== userId) {
        return fail({ code: ErrorCode.FORBIDDEN, message: "Anda tidak memiliki akses untuk mengubah iklan ini" });
      }

      if (![AdvertisementStatus.PENDING, AdvertisementStatus.APPROVED].includes(existing.status)) {
        return fail({ code: ErrorCode.BUSINESS_RULE_VIOLATION, message: "Iklan tidak dapat diubah karena statusnya sudah berubah" });
      }

      // Validate date range if both provided
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (end < start) {
          return fail({ code: ErrorCode.VALIDATION_ERROR, message: "Tanggal berakhir harus setelah tanggal mulai" });
        }
      }

      const advertisement = await this.repository.updateAdvertisement(id, data);

      if (!advertisement) {
        return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengupdate iklan" });
      }

      console.log("✅ Advertisement updated:", id);
      return ok(advertisement);
    } catch (error) {
      console.error("❌ Error updating advertisement:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengupdate iklan" });
    }
  }

  /**
   * Toggle active status (SuperAdmin)
   */
  async toggleActiveStatus(id: string, isActive: boolean): Promise<Result<AdvertisementDTO>> {
    try {
      const advertisement = await this.repository.toggleActiveStatus(id, isActive);

      if (!advertisement) {
        return fail({ code: ErrorCode.RESOURCE_NOT_FOUND, message: "Iklan tidak ditemukan" });
      }

      return ok(advertisement);
    } catch (error) {
      console.error("❌ Error toggling advertisement status:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengubah status iklan" });
    }
  }

  /**
   * Delete advertisement (AdminKos - only if PENDING or REJECTED)
   */
  async deleteAdvertisement(id: string, userId: string): Promise<Result<void>> {
    try {
      console.log("🗑️ Deleting advertisement:", { id, userId });

      const existing = await this.repository.getById(id);
      if (!existing) {
        return fail({ code: ErrorCode.RESOURCE_NOT_FOUND, message: "Iklan tidak ditemukan" });
      }

      if (existing.submittedBy !== userId) {
        return fail({ code: ErrorCode.FORBIDDEN, message: "Anda tidak memiliki akses untuk menghapus iklan ini" });
      }

      if (![AdvertisementStatus.PENDING, AdvertisementStatus.REJECTED].includes(existing.status)) {
        return fail({ code: ErrorCode.BUSINESS_RULE_VIOLATION, message: "Iklan tidak dapat dihapus karena sudah di-review" });
      }

      await this.repository.deleteAdvertisement(id);

      console.log("✅ Advertisement deleted:", id);
      return ok(undefined);
    } catch (error) {
      console.error("❌ Error deleting advertisement:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal menghapus iklan" });
    }
  }

  /**
   * Force delete advertisement (SuperAdmin)
   */
  async forceDeleteAdvertisement(id: string): Promise<Result<void>> {
    try {
      console.log("🗑️ Force deleting advertisement:", id);

      const existing = await this.repository.getById(id);
      if (!existing) {
        return fail({ code: ErrorCode.RESOURCE_NOT_FOUND, message: "Iklan tidak ditemukan" });
      }

      await this.repository.deleteAdvertisement(id);

      console.log("✅ Advertisement force deleted:", id);
      return ok(undefined);
    } catch (error) {
      console.error("❌ Error force deleting advertisement:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal menghapus iklan" });
    }
  }

  /**
   * Get public advertisements for specific layout slot
   */
  async getPublicAdvertisementsBySlot(
    layoutSlot: number
  ): Promise<Result<PublicAdvertisementDTO[]>> {
    try {
      const advertisements = await this.repository.getPublicAdvertisementsBySlot(layoutSlot);

      return ok(advertisements);
    } catch (error) {
      console.error("❌ Error getting public advertisements:", error);
      return fail({ code: ErrorCode.INTERNAL_ERROR, message: "Gagal mengambil iklan publik" });
    }
  }
}


