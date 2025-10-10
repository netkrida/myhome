"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploaderProps {
  currentAvatar?: string | null;
  userName?: string | null;
  onSuccess?: (url: string) => void;
}

export function AvatarUploader({ currentAvatar, userName, onSuccess }: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentAvatar || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipe file tidak didukung. Gunakan file JPG, PNG, atau WebP");
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File terlalu besar. Ukuran file maksimal 2MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/settings/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Avatar berhasil diupload");
        setPreviewUrl(data.data.url);
        onSuccess?.(data.data.url);
      } else {
        toast.error(data.error || "Gagal mengupload avatar");
        // Revert preview
        setPreviewUrl(currentAvatar || null);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Terjadi kesalahan saat mengupload avatar");
      // Revert preview
      setPreviewUrl(currentAvatar || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus avatar?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/settings/avatar", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Avatar berhasil dihapus");
        setPreviewUrl(null);
        onSuccess?.("");
      } else {
        toast.error(data.error || "Gagal menghapus avatar");
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Terjadi kesalahan saat menghapus avatar");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <CardTitle>Foto Profil</CardTitle>
        </div>
        <CardDescription>
          Upload foto profil Anda (JPG, PNG, atau WebP, maks. 2MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Avatar Preview */}
          <Avatar className="h-32 w-32">
            <AvatarImage src={previewUrl || undefined} alt={userName ?? undefined} />
            <AvatarFallback className="text-2xl">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {/* Upload/Delete Buttons */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Foto
                </>
              )}
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isUploading || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Foto profil akan ditampilkan di dashboard dan halaman publik
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

