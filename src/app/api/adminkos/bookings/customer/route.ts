/**
 * POST /api/adminkos/bookings/customer
 * Find or create customer for manual booking
 * Tier 1: HTTP API Controller
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { UserRepository } from "@/server/repositories/user.repository";
import { UserRole } from "@/server/types/rbac";
import { z } from "zod";

const customerSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role
    if (userContext.role !== UserRole.ADMINKOS) {
      return NextResponse.json(
        { success: false, error: "Only AdminKos can create manual bookings" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = customerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, name, phoneNumber } = validationResult.data;

    // Check if customer exists
    const existingUserResult = await UserRepository.getByEmail(email);
    
    if (existingUserResult.success && existingUserResult.data) {
      // Customer exists
      const user = existingUserResult.data;
      
      // Check if user is a customer
      if (user.role !== UserRole.CUSTOMER) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Email sudah terdaftar dengan role lain. Gunakan email berbeda." 
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          name: user.name,
          isNew: false,
        },
      });
    }

    // Customer doesn't exist, create new one
    const createResult = await UserRepository.create({
      email,
      name: name || email.split("@")[0], // Use email prefix as default name
      role: UserRole.CUSTOMER,
      phoneNumber,
      isActive: true,
    });

    if (!createResult.success) {
      return NextResponse.json(
        { success: false, error: createResult.error },
        { status: createResult.statusCode || 500 }
      );
    }

    const newUser = createResult.data!;

    return NextResponse.json({
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isNew: true,
      },
    });

  } catch (error) {
    console.error("Error in customer route:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

