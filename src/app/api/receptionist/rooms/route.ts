import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/server/lib/auth";
import { ReceptionistRepository } from "@/server/repositories/receptionist.repository";
import { RoomRepository } from "@/server/repositories/room.repository";

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

    const { propertyId } = profileResult.data;
    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "Receptionist is not assigned to any property" },
        { status: 404 }
      );
    }

    const rooms = await RoomRepository.findForProperty(propertyId);

    return NextResponse.json({ success: true, data: { propertyId, rooms } });
  } catch (error) {
    console.error("Error in GET /api/receptionist/rooms:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
