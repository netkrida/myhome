"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  ArrowLeft,
  Save,
  Bed,
  FileText,
  Image as ImageIcon,
  Home,
  DollarSign,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Bath
} from "lucide-react";
import { toast } from "sonner";
import { ROOM_FACILITIES, type RoomFacility } from "@/server/types/room";

// Form schema
const roomTypeSchema = z.object({
  // Step 1: Room Type Info
  roomType: z.string().min(1, "Nama jenis kamar harus diisi").max(100, "Nama terlalu panjang"),
  totalRooms: z.coerce.number().int().min(1, "Minimal 1 kamar").max(100, "Maksimal 100 kamar"),
  floor: z.coerce.number().int().min(1, "Lantai minimal 1").max(50, "Lantai maksimal 50"),
  size: z.string().max(50, "Ukuran terlalu panjang").optional(),

  // Step 2: Description
  description: z.string().max(1000, "Deskripsi terlalu panjang (maksimal 1000 karakter)").optional(),

  // Step 3: Photos (handled separately)
  // Step 4: Facilities
  facilities: z.array(z.any()).min(1, "Pilih minimal 1 fasilitas"),

  // Step 5: Pricing
  monthlyPrice: z.coerce.number().positive("Harga bulanan harus lebih dari 0"),
  dailyPrice: z.coerce.number().positive("Harga harian harus lebih dari 0").nullable().optional(),
  weeklyPrice: z.coerce.number().positive("Harga mingguan harus lebih dari 0").nullable().optional(),
  quarterlyPrice: z.coerce.number().positive("Harga 3 bulan harus lebih dari 0").nullable().optional(),
  yearlyPrice: z.coerce.number().positive("Harga tahunan harus lebih dari 0").nullable().optional(),
});

type RoomTypeFormData = z.infer<typeof roomTypeSchema>;

interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

type PhotoCategory = 'front' | 'inside' | 'bathroom';

export default function AddRoomTypePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frontPhotos, setFrontPhotos] = useState<ImageUpload[]>([]);
  const [insidePhotos, setInsidePhotos] = useState<ImageUpload[]>([]);
  const [bathroomPhotos, setBathroomPhotos] = useState<ImageUpload[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const form = useForm<RoomTypeFormData>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      roomType: "",
      totalRooms: 1,
      floor: 1,
      size: "",
      description: "",
      facilities: [],
      monthlyPrice: 0,
      dailyPrice: null,
      weeklyPrice: null,
      quarterlyPrice: null,
      yearlyPrice: null,
    },
    mode: "onChange",
  });

  // Image upload handlers
  const handleFileSelect = async (files: FileList | null, category: PhotoCategory) => {
    if (!files || files.length === 0) return;

    const getUploads = () => {
      switch (category) {
        case 'front': return frontPhotos;
        case 'inside': return insidePhotos;
        case 'bathroom': return bathroomPhotos;
      }
    };

    const currentCount = getUploads().length;
    const maxImages = 5;

    if (currentCount >= maxImages) {
      toast.error(`Maksimal ${maxImages} foto per kategori`);
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

    // Add to appropriate state
    switch (category) {
      case 'front':
        setFrontPhotos(prev => [...prev, ...newUploads]);
        break;
      case 'inside':
        setInsidePhotos(prev => [...prev, ...newUploads]);
        break;
      case 'bathroom':
        setBathroomPhotos(prev => [...prev, ...newUploads]);
        break;
    }

    // Start uploading
    uploadFiles(newUploads, category);
  };

  const uploadFiles = async (filesToUpload: ImageUpload[], category: PhotoCategory) => {
    const setStateFunc = category === 'front' ? setFrontPhotos :
                         category === 'inside' ? setInsidePhotos :
                         setBathroomPhotos;

    const subcategoryMap = {
      front: 'front-room',
      inside: 'inside-room',
      bathroom: 'bathroom-room'
    };

    for (let i = 0; i < filesToUpload.length; i++) {
      const upload = filesToUpload[i];
      if (!upload) continue;

      // Mark as uploading
      setStateFunc(prev => prev.map(u =>
        u.preview === upload.preview ? { ...u, uploading: true } : u
      ));

      try {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('category', 'room-photos');
        formData.append('subcategory', subcategoryMap[category]);

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
        setStateFunc(prev => prev.map(u =>
          u.preview === upload.preview
            ? {
                ...u,
                uploading: false,
                uploaded: true,
                url: result.data.secure_url,
                publicId: result.data.public_id
              }
            : u
        ));

        // Don't show toast for each upload to avoid spam
      } catch (error) {
        console.error('Upload error:', error);
        setStateFunc(prev => prev.map(u =>
          u.preview === upload.preview
            ? { ...u, uploading: false, error: 'Upload gagal' }
            : u
        ));
        toast.error(`Gagal upload foto`);
      }
    }
  };

  const removeImage = (index: number, category: PhotoCategory) => {
    const setStateFunc = category === 'front' ? setFrontPhotos :
                         category === 'inside' ? setInsidePhotos :
                         setBathroomPhotos;

    setStateFunc(prev => {
      const updated = [...prev];
      if (updated[index]?.preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const retryUpload = (index: number, category: PhotoCategory) => {
    const uploads = category === 'front' ? frontPhotos :
                    category === 'inside' ? insidePhotos :
                    bathroomPhotos;
    const upload = uploads[index];
    if (upload) {
      uploadFiles([upload], category);
    }
  };

  // Facility handlers
  const handleFacilityToggle = (facilityId: string, checked: boolean) => {
    setSelectedFacilities(prev => {
      if (checked) {
        return [...prev, facilityId];
      } else {
        return prev.filter(id => id !== facilityId);
      }
    });

    const newFacilities = ROOM_FACILITIES.filter(f =>
      checked
        ? [...selectedFacilities, facilityId].includes(f.id)
        : selectedFacilities.filter(id => id !== facilityId).includes(f.id)
    );

    form.setValue("facilities", newFacilities, { shouldValidate: true });
  };

  const selectAllInCategory = (category: 'room' | 'bathroom') => {
    const categoryFacilities = ROOM_FACILITIES.filter(f => f.category === category);
    const categoryIds = categoryFacilities.map(f => f.id);
    const otherCategorySelected = selectedFacilities.filter(id =>
      !categoryIds.includes(id)
    );

    const newSelectedFacilities = [...otherCategorySelected, ...categoryIds];
    const newFacilities = ROOM_FACILITIES.filter(f =>
      newSelectedFacilities.includes(f.id)
    );

    setSelectedFacilities(newSelectedFacilities);
    form.setValue("facilities", newFacilities, { shouldValidate: true });
  };

  const clearAllInCategory = (category: 'room' | 'bathroom') => {
    const categoryFacilities = ROOM_FACILITIES.filter(f => f.category === category);
    const categoryIds = categoryFacilities.map(f => f.id);
    const newSelectedFacilities = selectedFacilities.filter(id =>
      !categoryIds.includes(id)
    );

    const newFacilities = ROOM_FACILITIES.filter(f =>
      newSelectedFacilities.includes(f.id)
    );

    setSelectedFacilities(newSelectedFacilities);
    form.setValue("facilities", newFacilities, { shouldValidate: true });
  };

  // Form submission
  const onSubmit = async (data: RoomTypeFormData) => {
    // Validate images - at least one photo in any category
    const uploadedFrontPhotos = frontPhotos.filter(u => u.uploaded && u.url);
    const uploadedInsidePhotos = insidePhotos.filter(u => u.uploaded && u.url);
    const uploadedBathroomPhotos = bathroomPhotos.filter(u => u.uploaded && u.url);

    const totalUploadedPhotos = uploadedFrontPhotos.length + uploadedInsidePhotos.length + uploadedBathroomPhotos.length;

    if (totalUploadedPhotos === 0) {
      toast.error("Minimal 1 foto harus diupload");
      return;
    }

    setIsSubmitting(true);

    try {
      const roomTypeData = {
        roomType: data.roomType,
        totalRooms: data.totalRooms,
        floor: data.floor,
        size: data.size || undefined,
        description: data.description || undefined,
        frontPhotos: uploadedFrontPhotos.map(u => ({
          url: u.url!,
          publicId: u.publicId || '',
        })),
        insidePhotos: uploadedInsidePhotos.map(u => ({
          url: u.url!,
          publicId: u.publicId || '',
        })),
        bathroomPhotos: uploadedBathroomPhotos.map(u => ({
          url: u.url!,
          publicId: u.publicId || '',
        })),
        facilities: data.facilities,
        monthlyPrice: data.monthlyPrice,
        dailyPrice: data.dailyPrice || undefined,
        weeklyPrice: data.weeklyPrice || undefined,
        quarterlyPrice: data.quarterlyPrice || undefined,
        yearlyPrice: data.yearlyPrice || undefined,
      };

      // Call API to create room type
      const response = await fetch(`/api/adminkos/properties/${propertyId}/room-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomTypeData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create room type');
      }

      toast.success(result.message || `Berhasil menambahkan ${data.totalRooms} kamar tipe ${data.roomType}`);
      router.push(`/dashboard/adminkos/properties/${propertyId}`);
    } catch (error) {
      console.error("Error creating room type:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan jenis kamar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get facilities by category
  const roomFacilities = ROOM_FACILITIES.filter(f => f.category === 'room');
  const bathroomFacilities = ROOM_FACILITIES.filter(f => f.category === 'bathroom');

  // Count selected facilities by category
  const selectedRoomCount = roomFacilities.filter(f => selectedFacilities.includes(f.id)).length;
  const selectedBathroomCount = bathroomFacilities.filter(f => selectedFacilities.includes(f.id)).length;

  // Helper component for photo upload section
  const PhotoUploadSection = ({
    title,
    description,
    category,
    photos,
    inputId
  }: {
    title: string;
    description: string;
    category: PhotoCategory;
    photos: ImageUpload[];
    inputId: string;
  }) => {
    const uploadingCount = photos.filter(u => u.uploading).length;
    const uploadedCount = photos.filter(u => u.uploaded).length;
    const errorCount = photos.filter(u => u.error).length;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
          <div className="text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <div className="space-y-1">
              <p className="text-xs font-medium">Pilih foto</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG hingga 5MB. Maksimal 5 foto.
              </p>
            </div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files, category)}
              className="hidden"
              id={inputId}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => document.getElementById(inputId)?.click()}
              disabled={photos.length >= 5}
            >
              <Upload className="h-3 w-3 mr-2" />
              Pilih Foto
            </Button>
          </div>
        </div>

        {/* Upload Status */}
        {uploadingCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Mengupload {uploadingCount} foto...
          </div>
        )}

        {errorCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {errorCount} foto gagal diupload
          </div>
        )}

        {/* Image Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((upload, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={upload.preview}
                    alt={`${title} ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Upload Status Overlay */}
                {upload.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}

                {upload.uploaded && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  </div>
                )}

                {upload.error && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center rounded-lg">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => retryUpload(index, category)}
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
                  onClick={() => removeImage(index, category)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="Tambah Jenis Kamar">
      <div className="container mx-auto px-4 lg:px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Jenis Kamar</h1>
          <p className="text-muted-foreground mt-1">
            Lengkapi informasi jenis kamar untuk properti Anda
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Informasi Jenis Kamar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Informasi Jenis Kamar
                </CardTitle>
                <CardDescription>
                  Nama dan detail dasar jenis kamar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nama Jenis Kamar <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Standard, Deluxe, VIP"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Nama untuk mengidentifikasi jenis kamar ini
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Jumlah Kamar <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="Contoh: 5"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Berapa banyak kamar yang akan dibuat dengan tipe ini
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Lantai <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            placeholder="Contoh: 1"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Lantai dimana kamar-kamar ini berada
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ukuran Kamar</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: 3x4m"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Ukuran kamar (opsional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Deskripsi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Deskripsi Jenis Kamar
                </CardTitle>
                <CardDescription>
                  Jelaskan karakteristik dan keunggulan jenis kamar ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi singkat tentang jenis kamar ini, fasilitas yang tersedia, dan keunggulannya..."
                          rows={6}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Jelaskan karakteristik dan keunggulan jenis kamar ini (opsional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Tips menulis deskripsi yang baik:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Jelaskan ukuran dan tata letak kamar</li>
                    <li>Sebutkan fasilitas utama yang tersedia</li>
                    <li>Highlight keunggulan dibanding tipe lain</li>
                    <li>Gunakan bahasa yang jelas dan menarik</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Foto Kamar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Foto Kamar
                </CardTitle>
                <CardDescription>
                  Upload foto-foto kamar dalam 3 kategori (minimal 1 foto total, maksimal 5 foto per kategori)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Foto Depan Kamar */}
                <PhotoUploadSection
                  title="Foto Depan Kamar"
                  description="Foto tampak depan/pintu masuk kamar"
                  category="front"
                  photos={frontPhotos}
                  inputId="upload-front-photos"
                />

                {/* Foto Dalam Kamar */}
                <PhotoUploadSection
                  title="Foto Dalam Kamar"
                  description="Foto interior kamar (tempat tidur, meja, lemari, dll)"
                  category="inside"
                  photos={insidePhotos}
                  inputId="upload-inside-photos"
                />

                {/* Foto Kamar Mandi */}
                <PhotoUploadSection
                  title="Foto Kamar Mandi"
                  description="Foto kamar mandi (toilet, shower, wastafel, dll)"
                  category="bathroom"
                  photos={bathroomPhotos}
                  inputId="upload-bathroom-photos"
                />

                <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">💡 Tips foto yang baik:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Gunakan pencahayaan yang cukup dan natural</li>
                    <li>Foto dari berbagai sudut untuk setiap kategori</li>
                    <li>Tampilkan fasilitas utama dengan jelas</li>
                    <li>Pastikan ruangan terlihat rapi dan bersih</li>
                    <li>Gunakan resolusi yang baik (minimal 800x600px)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Fasilitas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Fasilitas Kamar
                </CardTitle>
                <CardDescription>
                  Pilih fasilitas yang tersedia di kamar dan kamar mandi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room Facilities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      <h3 className="font-semibold">Fasilitas Kamar</h3>
                      <Badge variant="outline">
                        {selectedRoomCount}/{roomFacilities.length}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => selectAllInCategory('room')}
                      >
                        Pilih Semua
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => clearAllInCategory('room')}
                      >
                        Hapus Semua
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roomFacilities.map((facility) => {
                      const isSelected = selectedFacilities.includes(facility.id);
                      return (
                        <label
                          key={facility.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/5 border-primary'
                              : 'bg-background border-border hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleFacilityToggle(facility.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{facility.name}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Bathroom Facilities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5" />
                      <h3 className="font-semibold">Fasilitas Kamar Mandi</h3>
                      <Badge variant="outline">
                        {selectedBathroomCount}/{bathroomFacilities.length}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => selectAllInCategory('bathroom')}
                      >
                        Pilih Semua
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => clearAllInCategory('bathroom')}
                      >
                        Hapus Semua
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bathroomFacilities.map((facility) => {
                      const isSelected = selectedFacilities.includes(facility.id);
                      return (
                        <label
                          key={facility.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/5 border-primary'
                              : 'bg-background border-border hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleFacilityToggle(facility.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{facility.name}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Section 5: Harga Sewa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Harga Sewa
                </CardTitle>
                <CardDescription>
                  Tentukan harga sewa untuk berbagai periode
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="monthlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Harga Bulanan <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="10000"
                          placeholder="Contoh: 1500000"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Harga sewa per bulan (wajib diisi)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dailyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Harian</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="10000"
                            placeholder="Contoh: 75000"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Harga sewa per hari (opsional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weeklyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Mingguan</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="10000"
                            placeholder="Contoh: 450000"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Harga sewa per minggu (opsional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quarterlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga 3 Bulan</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="10000"
                            placeholder="Contoh: 4000000"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Harga sewa per 3 bulan (opsional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Tahunan</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="10000"
                            placeholder="Contoh: 15000000"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Harga sewa per tahun (opsional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Tips menentukan harga:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Riset harga kos di sekitar lokasi Anda</li>
                    <li>Pertimbangkan fasilitas yang disediakan</li>
                    <li>Berikan diskon untuk sewa jangka panjang</li>
                    <li>Harga harus kompetitif namun tetap menguntungkan</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Jenis Kamar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
