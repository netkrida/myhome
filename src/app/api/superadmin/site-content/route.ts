/**
 * /api/superadmin/site-content
 * SuperAdmin site content management
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import {
    getSiteContentForAdmin,
    updateSiteContent,
    getAllSiteContent,
} from "@/server/api/site-content.api";
import type { SiteContentType } from "@/server/repositories/site-content.repository";

/**
 * GET /api/superadmin/site-content
 * Get site content for admin
 * Query params: ?type=terms|privacy (optional, returns all if not specified)
 */
export async function GET(request: NextRequest) {
    try {
        const userContext = await getCurrentUserContext();
        if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") as SiteContentType | null;

        if (type) {
            const content = await getSiteContentForAdmin(type);
            return NextResponse.json({
                success: true,
                data: content,
            });
        }

        // Return all site content
        const allContent = await getAllSiteContent();
        return NextResponse.json({
            success: true,
            data: allContent,
        });
    } catch (error) {
        console.error("❌ Error in GET /api/superadmin/site-content:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/superadmin/site-content
 * Update site content
 * Body: { type: "terms"|"privacy", title?: string, content: string, isPublished?: boolean }
 */
export async function PUT(request: NextRequest) {
    try {
        const userContext = await getCurrentUserContext();
        if (!userContext || userContext.role !== UserRole.SUPERADMIN) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, title, content, isPublished } = body;

        if (!type || !["terms", "privacy"].includes(type)) {
            return NextResponse.json(
                { success: false, error: "Invalid content type" },
                { status: 400 }
            );
        }

        const updatedContent = await updateSiteContent(
            type as SiteContentType,
            { title, content, isPublished },
            userContext.id
        );

        return NextResponse.json({
            success: true,
            data: updatedContent,
            message: "Content updated successfully",
        });
    } catch (error) {
        console.error("❌ Error in PUT /api/superadmin/site-content:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
