import { NextResponse } from "next/server";

import { CustomerAPI } from "@/server/api/customer.api";

export async function GET() {
  try {
    const result = await CustomerAPI.getProfile();

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error?.message ?? "Failed to load customer profile",
          code: result.error?.code,
        },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error) {
    console.error("Error in GET /api/dashboard/customer/profile:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
