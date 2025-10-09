"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, Upload, X, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export interface Step3Data {
  images: Array<{
    url: string;
    publicId: string;
  }>;
}

interface Step3PhotosProps {
  onDataChange: (data: Step3Data) => void;
  initialData?: Partial<Step3Data>;
}

export function Step3Photos({ onDataChange, initialData }: Step3PhotosProps) {
  const [uploads, setUploads] = useState<ImageUpload[]>([]);

  // Update parent when uploads change
  useEffect(() => {
    const uploadedImages = uploads
      .filter(u => u.uploaded && u.url)
      .map(u => ({
        url: u.url!,
        publicId: u.url!.split('/').pop()?.split('.')[0] || '',
      }));

    onDataChange({ images: uploadedImages });
  }, [uploads, onDataChange]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentCount = uploads.length;
    const maxImages = 10;

    if (currentCount >= maxImages) {
      toast.error(`Maksimal ${maxImages} foto`);
      return;
    }

    const newFiles = Array.from(files).slice(0, maxImages - currentCount);

    // Validate files
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} bukan gambar yang valid`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar (maksimal 5MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create upload objects
    const newUploads: ImageUpload[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploading
    uploadFiles(newUploads);
  };

  const uploadFiles = async (filesToUpload: ImageUpload[]) => {
    for (let i = 0; i < filesToUpload.length; i++) {
      const upload = filesToUpload[i];
      if (!upload) continue;
      const uploadIndex = uploads.findIndex(u => u.preview === upload.preview);

      // Mark as uploading
      setUploads(prev => prev.map((u, idx) =>
        idx === uploadIndex ? { ...u, uploading: true } : u
      ));

      try {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('category', 'room-photos');
        formData.append('subcategory', 'room-type');

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Mark as uploaded
        setUploads(prev => prev.map((u, idx) =>
          idx === uploadIndex
            ? { ...u, uploading: false, uploaded: true, url: result.data.secure_url }
            : u
        ));

        toast.success(`Foto ${i + 1} berhasil diupload`);
      } catch (error) {
        console.error('Upload error:', error);
        setUploads(prev => prev.map((u, idx) =>
          idx === uploadIndex
            ? { ...u, uploading: false, error: 'Upload gagal' }
            : u
        ));
        toast.error(`Gagal upload foto ${i + 1}`);
      }
    }
  };

  const removeImage = (index: number) => {
    setUploads(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const retryUpload = (index: number) => {
    const upload = uploads[index];
    if (upload) {
      uploadFiles([upload]);
    }
  };

  const uploadingCount = uploads.filter(u => u.uploading).length;
  const uploadedCount = uploads.filter(u => u.uploaded).length;
  const errorCount = uploads.filter(u => u.error).length;

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Upload foto-foto kamar untuk jenis kamar ini. Minimal 1 foto, maksimal 10 foto.
          Foto yang bagus akan membantu calon penyewa memahami kondisi kamar.
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
        <div className="text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Pilih foto kamar</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG hingga 5MB. Maksimal 10 foto.
            </p>
          </div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="upload-photos"
          />
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => document.getElementById('upload-photos')?.click()}
            disabled={uploads.length >= 10}
          >
            <Upload className="h-4 w-4 mr-2" />
            Pilih Foto
          </Button>
        </div>
      </div>

      {/* Upload Status */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mengupload {uploadingCount} foto...
        </div>
      )}

      {errorCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {errorCount} foto gagal diupload
        </div>
      )}

      {/* Image Grid */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploads.map((upload, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={upload.preview}
                  alt={`Upload ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Upload Status Overlay */}
              {upload.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}

              {upload.error && (
                <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center rounded-lg">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => retryUpload(index)}
                  >
                    Coba Lagi
                  </Button>
                </div>
              )}

              {/* Remove Button */}
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-2">Tips foto yang baik:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Gunakan pencahayaan yang cukup</li>
          <li>Foto dari berbagai sudut ruangan</li>
          <li>Tampilkan fasilitas utama (tempat tidur, meja, lemari)</li>
          <li>Pastikan ruangan terlihat rapi dan bersih</li>
          <li>Gunakan resolusi yang baik (minimal 800x600px)</li>
        </ul>
      </div>
    </div>
  );
}

