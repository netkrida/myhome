import { NextResponse } from "next/server";
import { PropertiesAPI } from "@/server/api/properties.api";

export async function GET() {
  try {
    const result = await PropertiesAPI.getPropertyCoordinates();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching property coordinates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
