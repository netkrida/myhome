import { NextRequest, NextResponse } from "next/server";

import { CustomerRegistrationAPI } from "@/server/api/customer-registration.api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await CustomerRegistrationAPI.registerCustomer(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.statusCode ?? 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Akun pemesan berhasil didaftarkan",
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in customer registration route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}
