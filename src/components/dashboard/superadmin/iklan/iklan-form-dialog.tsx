"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Advertisement } from "@/app/(protected-pages)/dashboard/superadmin/iklan/page";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { uploadImageFromBrowser, validateImageFile } from "@/lib/upload-helpers";

const formSchema = z.object({
  title: z.string().min(1, "Judul harus diisi").max(255, "Judul maksimal 255 karakter"),
  description: z.string().optional(),
  linkUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0, "Urutan harus 0 atau lebih"),
  isActive: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface IklanFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingAd: Advertisement | null;
}

export function IklanFormDialog({
  isOpen,
  onClose,
  onSuccess,
  editingAd,
}: IklanFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      linkUrl: "",
      sortOrder: 0,
      isActive: true,
      startDate: "",
      endDate: "",
    },
  });

  // Reset form when dialog opens/closes or editingAd changes
  useEffect(() => {
    if (isOpen) {
      if (editingAd) {
        form.reset({
          title: editingAd.title,
          description: editingAd.description || "",
          linkUrl: editingAd.linkUrl || "",
          sortOrder: editingAd.sortOrder,
          isActive: editingAd.isActive,
          startDate: editingAd.startDate
            ? new Date(editingAd.startDate).toISOString().slice(0, 16)
            : "",
          endDate: editingAd.endDate
            ? new Date(editingAd.endDate).toISOString().slice(0, 16)
            : "",
        });
        setImagePreview(editingAd.imageUrl);
        setImageFile(null);
      } else {
        form.reset({
          title: "",
          description: "",
          linkUrl: "",
          sortOrder: 0,
          isActive: true,
          startDate: "",
          endDate: "",
        });
        setImagePreview("");
        setImageFile(null);
      }
    }
  }, [isOpen, editingAd, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(editingAd?.imageUrl || "");
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      let imageUrl = editingAd?.imageUrl || "";
      let publicId = editingAd?.publicId || null;

      // Upload new image if selected
      if (imageFile) {
        console.log("Starting image upload...", { fileName: imageFile.name, size: imageFile.size });
        setIsUploading(true);
        try {
          const uploadResult = await uploadImageFromBrowser(
            imageFile,
            "advertisements"
          );
          console.log("Upload result:", uploadResult);
          imageUrl = uploadResult.secure_url;
          publicId = uploadResult.public_id;
          console.log("Image uploaded successfully:", { imageUrl, publicId });
        } catch (error) {
          console.error("Image upload error:", error);
          const errorMsg = error instanceof Error ? error.message : "Gagal mengupload gambar";
          toast.error(errorMsg);
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Validate that we have an image URL
      if (!imageUrl) {
        toast.error("Gambar harus diupload");
        setIsSubmitting(false);
        return;
      }

      // Prepare data
      const data = {
        title: values.title,
        description: values.description || null,
        imageUrl,
        publicId,
        linkUrl: values.linkUrl || null,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      };

      // Submit to API
      const url = editingAd
        ? `/api/superadmin/iklan/${editingAd.id}`
        : "/api/superadmin/iklan";
      const method = editingAd ? "PATCH" : "POST";

      console.log("Sending data to API:", data);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("API response:", { status: response.status, result });

      if (result.success) {
        toast.success(
          editingAd ? "Iklan berhasil diperbarui!" : "Iklan berhasil ditambahkan!"
        );
        onSuccess();
      } else {
        console.error("API error:", result.error);
        toast.error(result.error || "Gagal menyimpan iklan");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Gagal menyimpan iklan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAd ? "Edit Iklan" : "Tambah Iklan Baru"}
          </DialogTitle>
          <DialogDescription>
            {editingAd
              ? "Perbarui informasi iklan"
              : "Tambahkan iklan baru untuk ditampilkan di halaman depan"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Gambar Iklan *</FormLabel>
              {imagePreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Klik untuk upload gambar
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-4"
                  />
                </div>
              )}
              <FormDescription>
                Upload gambar iklan (maksimal 10MB, format: JPG, PNG, WebP)
              </FormDescription>
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul *</FormLabel>
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
                      placeholder="Masukkan deskripsi iklan (opsional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
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
                  <FormLabel>Link URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link yang akan dibuka ketika iklan diklik (opsional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Sort Order */}
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Urutan tampil (0 = pertama)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm">
                          {field.value ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>Opsional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>Opsional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isUploading
                  ? "Mengupload..."
                  : isSubmitting
                  ? "Menyimpan..."
                  : editingAd
                  ? "Perbarui"
                  : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
