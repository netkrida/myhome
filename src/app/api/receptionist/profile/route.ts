import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { ReceptionistRepository } from "@/server/repositories/adminkos/receptionist.repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUserContext();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const profileResult = await ReceptionistRepository.findProfileByUserId(user.id);
    if (!profileResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: profileResult.error.message,
          code: profileResult.error.code,
        },
        { status: profileResult.statusCode }
      );
    }

    return NextResponse.json({ success: true, data: profileResult.data });
  } catch (error) {
    console.error("Error in GET /api/receptionist/profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
