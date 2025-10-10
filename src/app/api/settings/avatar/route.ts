/**
 * Avatar API Routes
 * POST /api/settings/avatar - Upload user avatar
 * DELETE /api/settings/avatar - Delete user avatar
 * Tier 1: HTTP API Controller
 */

import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { uploadMyAvatar, deleteMyAvatar } from "@/server/api/settings/avatar.service";

/**
 * POST - Upload user avatar
 */
export async function POST(req: Request) {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload avatar
    const result = await uploadMyAvatar(userContext.id, {
      buffer,
      filename: file.name,
      mime: file.type,
      size: file.size,
    });

    return NextResponse.json({
      success: true,
      data: { url: result.url },
      message: "Avatar berhasil diupload",
    });
  } catch (error: any) {
    console.error("Error in POST /api/settings/avatar:", error);
    
    // Handle business logic errors
    if (error.message) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete user avatar
 */
export async function DELETE() {
  try {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await deleteMyAvatar(userContext.id);

    return NextResponse.json({
      success: true,
      message: "Avatar berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/settings/avatar:", error);
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

