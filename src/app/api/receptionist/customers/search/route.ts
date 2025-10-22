import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRepository } from "@/server/repositories/user.repository";
import { UserRole } from "@/server/types/rbac";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== UserRole.RECEPTIONIST) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const query = request.nextUrl.searchParams.get("q");
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    const results = await UserRepository.searchCustomers(query.trim(), 8);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error in GET /api/receptionist/customers/search:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
