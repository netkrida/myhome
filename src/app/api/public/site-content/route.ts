/**
 * /api/public/site-content
 * Public site content API
 */

import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteContent } from "@/server/api/site-content.api";
import type { SiteContentType } from "@/server/repositories/site-content.repository";

/**
 * GET /api/public/site-content
 * Get published site content for public display
 * Query params: ?type=terms|privacy (required)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") as SiteContentType | null;

        if (!type || !["terms", "privacy"].includes(type)) {
            return NextResponse.json(
                { success: false, error: "Invalid or missing content type" },
                { status: 400 }
            );
        }

        const content = await getPublicSiteContent(type);

        if (!content) {
            return NextResponse.json(
                { success: false, error: "Content not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: content,
        });
    } catch (error) {
        console.error("❌ Error in GET /api/public/site-content:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
