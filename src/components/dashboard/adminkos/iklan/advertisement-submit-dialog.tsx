"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { AdvertisementDTO } from "@/server/types/advertisement.types";
import { CloudinaryUploadWidget } from "@/components/cloudinary/cloudinary-upload-widget";

const formSchema = z.object({
  title: z.string().min(1, "Judul harus diisi").max(255, "Judul maksimal 255 karakter"),
  description: z.string().optional(),
  imageUrl: z.string().url("URL gambar tidak valid").min(1, "Gambar harus diupload"),
  publicId: z.string().optional(),
  linkUrl: z.string().url("URL link tidak valid").optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AdvertisementSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAd: AdvertisementDTO | null;
  onSuccess: () => void;
}

export function AdvertisementSubmitDialog({
  open,
  onOpenChange,
  editingAd,
  onSuccess,
}: AdvertisementSubmitDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingAd?.title || "",
      description: editingAd?.description || "",
      imageUrl: editingAd?.imageUrl || "",
      publicId: editingAd?.publicId || "",
      linkUrl: editingAd?.linkUrl || "",
      startDate: editingAd?.startDate
        ? new Date(editingAd.startDate).toISOString().slice(0, 16)
        : "",
      endDate: editingAd?.endDate ? new Date(editingAd.endDate).toISOString().slice(0, 16) : "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      };

      const url = editingAd ? `/api/adminkos/iklan/${editingAd.id}` : "/api/adminkos/iklan";
      const method = editingAd ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingAd ? "Iklan berhasil diupdate!" : "Iklan berhasil diajukan!");
        onSuccess();
        form.reset();
      } else {
        toast.error(result.error || "Gagal menyimpan iklan");
      }
    } catch (error) {
      console.error("Error submitting advertisement:", error);
      toast.error("Gagal menyimpan iklan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (result: any) => {
    console.log("🖼️ Upload success - Raw result:", result);
    
    const imageUrl = result.secure_url;
    const publicId = result.public_id;
    
    console.log("🖼️ Extracted values:", { imageUrl, publicId });
    
    if (!imageUrl) {
      console.error("❌ No secure_url in upload result!");
      toast.error("Upload gagal: URL gambar tidak ditemukan");
      setIsUploading(false);
      return;
    }
    
    form.setValue("imageUrl", imageUrl, { shouldValidate: true });
    if (publicId) {
      form.setValue("publicId", publicId);
    }
    
    console.log("✅ Form values updated:", form.getValues());
    toast.success("Gambar berhasil diupload!");
    setIsUploading(false);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  return (
    <Dialog open={open && !isUploading} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAd ? "Edit Iklan" : "Ajukan Iklan Baru"}</DialogTitle>
          <DialogDescription>
            {editingAd
              ? "Update informasi iklan Anda"
              : "Isi form berikut untuk mengajukan iklan baru"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Judul Iklan <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul iklan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi singkat tentang iklan (opsional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Gambar Iklan <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <CloudinaryUploadWidget
                        onUploadSuccess={handleUploadSuccess}
                        onUploadStart={handleUploadStart}
                        folder="advertisements"
                      />
                      {field.value && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                          <img
                            src={field.value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Ukuran gambar direkomendasikan: 1200x400px (ratio 3:1)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link URL */}
            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Tujuan</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://contoh.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Link yang akan dibuka ketika iklan diklik (opsional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Berakhir</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Menyimpan..." : editingAd ? "Update" : "Ajukan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
