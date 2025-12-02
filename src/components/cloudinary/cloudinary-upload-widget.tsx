"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: any) => void;
  onUploadStart?: () => void;
  folder?: string;
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadStart,
  folder = "advertisements",
}: CloudinaryUploadWidgetProps) {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Load Cloudinary widget script
    if (!(window as any).cloudinary) {
      const script = document.createElement("script");
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const openWidget = () => {
    // Check if env vars are set
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert(
        "Cloudinary configuration missing!\n\n" +
        "Please add to .env file:\n" +
        "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name\n" +
        "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset\n\n" +
        "Then restart the dev server."
      );
      console.error("Cloudinary config:", { cloudName, uploadPreset });
      return;
    }

    if (!(window as any).cloudinary) {
      alert("Cloudinary widget is still loading. Please try again in a moment.");
      return;
    }

    if (!widgetRef.current) {
      widgetRef.current = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          folder: folder,
          sources: ["local", "url", "camera"],
          multiple: false,
          maxFileSize: 5000000, // 5MB
          clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
          cropping: false,
          showSkipCropButton: true,
          // Fix z-index to appear above dialogs
          inlineContainer: null,
          styles: {
            palette: {
              window: "#FFFFFF",
              windowBorder: "#90A0B3",
              tabIcon: "#0078FF",
              menuIcons: "#5A616A",
              textDark: "#000000",
              textLight: "#FFFFFF",
              link: "#0078FF",
              action: "#FF620C",
              inactiveTabIcon: "#0E2F5A",
              error: "#F44235",
              inProgress: "#0078FF",
              complete: "#20B832",
              sourceBg: "#E4EBF1",
            },
            frame: {
              background: "rgba(0, 0, 0, 0.7)",
            },
          },
          // IMPORTANT: Set high z-index to appear above shadcn Dialog
          zIndex: 99999,
        },
        (error: any, result: any) => {
          console.log("📸 Cloudinary widget event:", { event: result?.event, error });
          
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            return;
          }
          
          if (result && result.event === "success") {
            console.log("✅ Cloudinary upload success:", result.info);
            onUploadSuccess(result.info);
          }
        }
      );
    }

    // Notify parent that upload is starting (dialog should hide)
    if (onUploadStart) {
      onUploadStart();
    }

    widgetRef.current.open();
  };

  return (
    <Button type="button" variant="outline" onClick={openWidget} className="w-full">
      <Upload className="h-4 w-4 mr-2" />
      Upload Gambar
    </Button>
  );
}
