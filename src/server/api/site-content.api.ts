/**
 * Site Content API
 * Server-side API functions for managing site content
 */

import { SiteContentRepository } from "@/server/repositories/site-content.repository";
import type { SiteContentType, UpdateSiteContentInput } from "@/server/repositories/site-content.repository";

export interface SiteContentResponse {
    id: string;
    type: string;
    title: string;
    content: string;
    isPublished: boolean;
    updatedAt: Date;
}

/**
 * Get published site content for public display
 */
export async function getPublicSiteContent(
    type: SiteContentType
): Promise<SiteContentResponse | null> {
    const content = await SiteContentRepository.findPublishedByType(type);

    if (!content) {
        return null;
    }

    return {
        id: content.id,
        type: content.type,
        title: content.title,
        content: content.content,
        isPublished: content.isPublished,
        updatedAt: content.updatedAt,
    };
}

/**
 * Get site content for admin (including unpublished)
 */
export async function getSiteContentForAdmin(
    type: SiteContentType
): Promise<SiteContentResponse | null> {
    const content = await SiteContentRepository.findByType(type);

    if (!content) {
        return null;
    }

    return {
        id: content.id,
        type: content.type,
        title: content.title,
        content: content.content,
        isPublished: content.isPublished,
        updatedAt: content.updatedAt,
    };
}

/**
 * Update site content (admin only)
 */
export async function updateSiteContent(
    type: SiteContentType,
    data: UpdateSiteContentInput,
    userId: string
): Promise<SiteContentResponse> {
    const content = await SiteContentRepository.upsert(type, {
        ...data,
        updatedBy: userId,
    });

    return {
        id: content.id,
        type: content.type,
        title: content.title,
        content: content.content,
        isPublished: content.isPublished,
        updatedAt: content.updatedAt,
    };
}

/**
 * Get all site content for admin dashboard
 */
export async function getAllSiteContent(): Promise<SiteContentResponse[]> {
    const contents = await SiteContentRepository.findAll();

    return contents.map((content) => ({
        id: content.id,
        type: content.type,
        title: content.title,
        content: content.content,
        isPublished: content.isPublished,
        updatedAt: content.updatedAt,
    }));
}
