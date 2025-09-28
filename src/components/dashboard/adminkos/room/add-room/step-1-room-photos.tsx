"use client";

import { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  X,
  Bed,
  Bath,
  Loader2,
  ImageIcon,
  AlertCircle,
  Eye,
  Home
} from "lucide-react";
import { FormPersistence } from "@/lib/form-persistence";
import { toast } from "sonner";
import { createRoomStep1Schema } from "@/server/schemas/room.schemas";
import { useMultiStepForm } from "@/components/ui/multi-step-form";

type Step1FormData = z.infer<typeof createRoomStep1Schema>;

interface Step1RoomPhotosProps {
  onDataChange: (data: Step1FormData) => void;
  initialData?: Partial<Step1FormData>;
  roomTypes: string[];
}

interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

const photoCategories = [
  {
    key: "frontViewPhotos",
    title: "Foto Kamar Tampak Depan",
    description: "Foto tampak depan kamar dari pintu masuk",
    icon: Eye,
    required: true,
    maxFiles: 3,
    examples: ["Pintu masuk", "Tampak keseluruhan", "Layout kamar"],
  },
  {
    key: "interiorPhotos",
    title: "Foto Kamar Tampak Dalam",
    description: "Foto interior dan perabotan dalam kamar",
    icon: Home,
    required: true,
    maxFiles: 5,
    examples: ["Tempat tidur", "Meja belajar", "Lemari", "Jendela", "Pencahayaan"],
  },
  {
    key: "bathroomPhotos",
    title: "Foto Kamar Mandi",
    description: "Foto kamar mandi dalam atau luar kamar",
    icon: Bath,
    required: true,
    maxFiles: 3,
    examples: ["Toilet", "Shower", "Wastafel", "Cermin"],
  },
];

export function Step1RoomPhotos({ onDataChange, initialData, roomTypes }: Step1RoomPhotosProps) {
  const [currentRoomType, setCurrentRoomType] = useState(roomTypes[0] || "");
  const [uploads, setUploads] = useState<Record<string, Record<string, ImageUpload[]>>>({});
  const { setStepValid } = useMultiStepForm();

  // Use refs to prevent infinite loops
  const previousDataRef = useRef<string>("");
  const previousValidityRef = useRef<boolean>(false);

  // Initialize form with room types
  const initializeRoomTypeData = () => {
    const roomTypePhotos: Record<string, any> = {};
    roomTypes.forEach(roomType => {
      roomTypePhotos[roomType] = {
        frontViewPhotos: [],
        interiorPhotos: [],
        bathroomPhotos: [],
        description: "",
      };
    });
    return roomTypePhotos;
  };

  const form = useForm<Step1FormData>({
    resolver: zodResolver(createRoomStep1Schema),
    defaultValues: {
      roomTypePhotos: initialData?.roomTypePhotos || initializeRoomTypeData(),
    },
  });

  const watchedData = form.watch();


  // Handle form validation and data changes with refs to prevent infinite loops
  useEffect(() => {
    const isValid = form.formState.isValid;
    const currentDataString = JSON.stringify(watchedData);

    // Only update step validity if it has changed
    if (previousValidityRef.current !== isValid) {
      setStepValid(0, isValid);
      previousValidityRef.current = isValid;
      console.log("Step1 - isValid changed:", isValid);
      console.log("Step1 - form errors:", form.formState.errors);
    }

    // Only call onDataChange and persist if data has actually changed
    if (previousDataRef.current !== currentDataString) {
      onDataChange(watchedData);
      previousDataRef.current = currentDataString;

      // Only persist when valid
      if (isValid) {
        FormPersistence.saveFormData(watchedData, {
          key: "room-creation-step-1",
          useSessionStorage: true,
        });
      }

      console.log("Step1 - data changed:", currentDataString);
    }
  });

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step1FormData>({
      key: "room-creation-step-1",
      useSessionStorage: true,
    });

    if (persistedData?.data && !initialData) {
      form.reset(persistedData.data);
    }
  }, [form, initialData]);


  // Hapus useEffect ini karena sudah digabung di atas


  // Hapus useEffect ini karena sudah digabung di atas

  // Initialize uploads state for current room type
  useEffect(() => {
    if (currentRoomType && !uploads[currentRoomType]) {
      setUploads(prev => ({
        ...prev,
        [currentRoomType]: {
          frontViewPhotos: [],
          interiorPhotos: [],
          bathroomPhotos: [],
        }
      }));
    }
  }, [currentRoomType, uploads]);

  // Handle file selection
  const handleFileSelect = (photoCategory: string, files: FileList | null) => {
    if (!files || !currentRoomType) return;

    const categoryConfig = photoCategories.find(cat => cat.key === photoCategory);
    if (!categoryConfig) return;

    const currentUploads = uploads[currentRoomType]?.[photoCategory] || [];
    const newFiles = Array.from(files);

    // Check file limit
    if (currentUploads.length + newFiles.length > categoryConfig.maxFiles) {
      toast.error(`Maksimal ${categoryConfig.maxFiles} foto untuk ${categoryConfig.title}`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} bukan gambar yang valid`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

    setUploads(prev => ({
      ...prev,
      [currentRoomType]: {
        ...prev[currentRoomType],
        [photoCategory]: [...currentUploads, ...newUploads],
      }
    }));

    // Start uploading
    uploadFiles(photoCategory, newUploads);
  };

  // Upload files to Cloudinary
  const uploadFiles = async (photoCategory: string, newUploads: ImageUpload[]) => {
    if (!currentRoomType) return;
    
    const categoryUploads = uploads[currentRoomType]?.[photoCategory] || [];
    
    for (let i = 0; i < newUploads.length; i++) {
      const uploadIndex = categoryUploads.length + i;
      
      // Mark as uploading
      setUploads(prev => ({
        ...prev,
        [currentRoomType]: {
          ...prev[currentRoomType],
          [photoCategory]: (prev[currentRoomType]?.[photoCategory] || []).map((upload, idx) => 
            idx === uploadIndex ? { ...upload, uploading: true } : upload
          ),
        }
      }));

      try {
        const currentUpload = newUploads[i];
        if (!currentUpload?.file) continue;
        
        const formData = new FormData();
        formData.append('file', currentUpload.file);
        formData.append('category', `rooms`);
        formData.append('subcategory', `${currentRoomType}/${photoCategory}`);

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
        
        // Mark as uploaded and save URL
        setUploads(prev => ({
          ...prev,
          [currentRoomType]: {
            ...prev[currentRoomType],
            [photoCategory]: (prev[currentRoomType]?.[photoCategory] || []).map((upload, idx) => 
              idx === uploadIndex 
                ? { ...upload, uploading: false, uploaded: true, url: result.data.secure_url }
                : upload
            ),
          }
        }));

        // Update form data
        const currentRoomTypeData = form.getValues(`roomTypePhotos.${currentRoomType}` as any);
        const currentUrls = currentRoomTypeData?.[photoCategory] || [];
        form.setValue(`roomTypePhotos.${currentRoomType}.${photoCategory}` as any, [...currentUrls, result.data.secure_url], { shouldValidate: true });

      } catch (error) {
        console.error('Upload error:', error);
        
        // Mark as error
        setUploads(prev => ({
          ...prev,
          [currentRoomType]: {
            ...prev[currentRoomType],
            [photoCategory]: (prev[currentRoomType]?.[photoCategory] || []).map((upload, idx) => 
              idx === uploadIndex 
                ? { ...upload, uploading: false, error: 'Upload gagal' }
                : upload
            ),
          }
        }));

        const currentUpload = newUploads[i];
        if (currentUpload?.file?.name) {
          toast.error(`Gagal upload ${currentUpload.file.name}`);
        }
      }
    }
  };

  // Remove image
  const removeImage = (photoCategory: string, index: number) => {
    if (!currentRoomType) return;
    
    const categoryUploads = uploads[currentRoomType]?.[photoCategory] || [];
    const upload = categoryUploads[index];
    
    // Revoke object URL to prevent memory leaks
    if (upload?.preview) {
      URL.revokeObjectURL(upload.preview);
    }

    // Remove from uploads
    setUploads(prev => ({
      ...prev,
      [currentRoomType]: {
        ...prev[currentRoomType],
        [photoCategory]: (prev[currentRoomType]?.[photoCategory] || []).filter((_, idx) => idx !== index),
      }
    }));

    // Remove from form data
    const currentRoomTypeData = form.getValues(`roomTypePhotos.${currentRoomType}` as any);
    const currentUrls = currentRoomTypeData?.[photoCategory] || [];
    const newUrls = currentUrls.filter((_: any, idx: number) => idx !== index);
    form.setValue(`roomTypePhotos.${currentRoomType}.${photoCategory}` as any, newUrls, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Room Type Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Foto Kamar per Jenis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload foto untuk setiap jenis kamar yang tersedia di properti Anda
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={currentRoomType} onValueChange={setCurrentRoomType}>
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {roomTypes.map((roomType) => (
                  <TabsTrigger key={roomType} value={roomType} className="text-sm">
                    {roomType}
                  </TabsTrigger>
                ))}
              </TabsList>

              {roomTypes.map((roomType) => (
                <TabsContent key={roomType} value={roomType} className="space-y-6 mt-6">
                  {/* Room Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Deskripsi {roomType}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name={`roomTypePhotos.${roomType}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deskripsi Kamar <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={`Deskripsikan ${roomType}, ukuran, kondisi, dan keunggulannya...`}
                                rows={4}
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Jelaskan secara detail tentang {roomType} untuk menarik calon penyewa
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Photo Categories */}
                  {photoCategories.map((categoryConfig) => {
                    const Icon = categoryConfig.icon;
                    const categoryUploads = uploads[roomType]?.[categoryConfig.key] || [];
                    const uploadedCount = categoryUploads.filter(u => u.uploaded).length;
                    const uploadingCount = categoryUploads.filter(u => u.uploading).length;
                    const errorCount = categoryUploads.filter(u => u.error).length;

                    return (
                      <Card key={categoryConfig.key}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {categoryConfig.title}
                            {categoryConfig.required && <span className="text-destructive">*</span>}
                            <Badge variant="outline" className="ml-auto">
                              {uploadedCount}/{categoryConfig.maxFiles}
                            </Badge>
                          </CardTitle>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {categoryConfig.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {categoryConfig.examples.map((example, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Upload Area */}
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                            <div className="text-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Pilih foto untuk {categoryConfig.title.toLowerCase()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG hingga 5MB. Maksimal {categoryConfig.maxFiles} foto.
                                </p>
                              </div>
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFileSelect(categoryConfig.key, e.target.files)}
                                className="hidden"
                                id={`upload-${roomType}-${categoryConfig.key}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="mt-4"
                                onClick={() => document.getElementById(`upload-${roomType}-${categoryConfig.key}`)?.click()}
                                disabled={categoryUploads.length >= categoryConfig.maxFiles}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Pilih Foto
                              </Button>
                            </div>
                          </div>

                          {/* Upload Progress */}
                          {uploadingCount > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Mengupload {uploadingCount} foto...
                              </div>
                              <Progress value={(uploadedCount / (uploadedCount + uploadingCount)) * 100} />
                            </div>
                          )}

                          {/* Error Summary */}
                          {errorCount > 0 && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              {errorCount} foto gagal diupload
                            </div>
                          )}

                          {/* Image Grid */}
                          {categoryUploads.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {categoryUploads.map((upload, index) => (
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
                                        onClick={() => uploadFiles(categoryConfig.key, [upload])}
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
                                    onClick={() => removeImage(categoryConfig.key, index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>

                                  {/* Upload Success Indicator */}
                                  {upload.uploaded && (
                                    <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Form Field for Validation */}
                          <FormField
                            control={form.control}
                            name={`roomTypePhotos.${roomType}.${categoryConfig.key}`}
                            render={() => (
                              <FormItem>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
