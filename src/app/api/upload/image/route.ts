import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserContext } from "@/server/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

/**
 * POST /api/upload/image
 * Upload image to Cloudinary
 * Access: Authenticated users only
 */
export async function POST(request: NextRequest) {
  try {
    // Get user context
    const context = await getCurrentUserContext();
    if (!context) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;
    const subcategory = formData.get("subcategory") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Prepare upload options
    const uploadOptions = {
      folder: `kos-properties/${category}`,
      tags: [category, subcategory].filter((tag): tag is string => Boolean(tag)),
      context: {
        category,
        subcategory: subcategory || "",
        uploadedBy: context.id,
      },
    };

    // Upload to Cloudinary
    const result = await uploadImage(file, uploadOptions);

    return NextResponse.json({
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });

  } catch (error) {
    console.error("Error in POST /api/upload/image:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Image upload failed";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
