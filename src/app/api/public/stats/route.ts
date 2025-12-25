import { NextResponse } from "next/server";
import { PublicStatsAPI } from "@/server/api/public-stats.api";

export async function GET() {
    try {
        const result = await PublicStatsAPI.getLandingStats();

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message || "Internal Server Error" },
                { status: result.statusCode || 500 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[public-stats-api] Unexpected error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
