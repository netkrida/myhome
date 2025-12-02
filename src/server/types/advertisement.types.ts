/**
 * Advertisement/Iklan Types
 */

export enum AdvertisementStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PLACED = "PLACED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface AdvertisementDTO {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  publicId: string | null;
  linkUrl: string | null;
  status: AdvertisementStatus;
  submittedBy: string;
  submittedByName: string | null;
  submittedAt: Date;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  layoutSlot: number | null;
  placedAt: Date | null;
  sortOrder: number;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicAdvertisementDTO {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  publicId: string | null;
  linkUrl: string | null;
  sortOrder: number;
}
