/**
 * Site Content Repository
 * Repository for managing dynamic site content like Terms, Privacy Policy, etc.
 */

import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { SiteContent } from "@prisma/client";

export type SiteContentType = "terms" | "privacy";

export interface CreateSiteContentInput {
    type: SiteContentType;
    title: string;
    content: string;
    isPublished?: boolean;
    updatedBy?: string;
}

export interface UpdateSiteContentInput {
    title?: string;
    content?: string;
    isPublished?: boolean;
    updatedBy?: string;
}

export const SiteContentRepository = {
    /**
     * Find site content by type
     */
    async findByType(type: SiteContentType): Promise<SiteContent | null> {
        return db.siteContent.findUnique({
            where: { type },
        });
    },

    /**
     * Find published site content by type (for public access)
     */
    async findPublishedByType(type: SiteContentType): Promise<SiteContent | null> {
        return db.siteContent.findFirst({
            where: {
                type,
                isPublished: true,
            },
        });
    },

    /**
     * Create or update site content (upsert)
     */
    async upsert(
        type: SiteContentType,
        data: UpdateSiteContentInput
    ): Promise<SiteContent> {
        const existingContent = await this.findByType(type);

        if (existingContent) {
            return db.siteContent.update({
                where: { type },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
        }

        // Create new content with default title based on type
        const defaultTitles: Record<SiteContentType, string> = {
            terms: "Syarat dan Ketentuan",
            privacy: "Kebijakan Privasi",
        };

        return db.siteContent.create({
            data: {
                type,
                title: data.title || defaultTitles[type],
                content: data.content || "",
                isPublished: data.isPublished ?? false,
                updatedBy: data.updatedBy,
            },
        });
    },

    /**
     * Update site content
     */
    async update(
        type: SiteContentType,
        data: UpdateSiteContentInput
    ): Promise<SiteContent | null> {
        try {
            return await db.siteContent.update({
                where: { type },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2025") {
                    return null; // Record not found
                }
            }
            throw error;
        }
    },

    /**
     * Get all site content entries
     */
    async findAll(): Promise<SiteContent[]> {
        return db.siteContent.findMany({
            orderBy: { type: "asc" },
        });
    },
};
