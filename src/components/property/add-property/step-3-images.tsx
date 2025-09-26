"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Building2, 
  Users, 
  Map,
  Loader2,
  ImageIcon,
  AlertCircle
} from "lucide-react";
import { useMultiStepForm } from "@/components/ui/multi-step-form";
import { FormPersistence } from "@/lib/form-persistence";
import { toast } from "sonner";
import { ImageCategory } from "@/server/types/property";

const step3Schema = z.object({
  buildingPhotos: z.array(z.string()).min(1, "Minimal 1 foto bangunan"),
  sharedFacilitiesPhotos: z.array(z.string()).optional(),
  floorPlanPhotos: z.array(z.string()).optional(),
});

type Step3FormData = z.infer<typeof step3Schema>;

interface Step3ImagesProps {
  onDataChange: (data: Step3FormData) => void;
  initialData?: Partial<Step3FormData>;
}

interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

const imageCategories = [
  {
    key: "buildingPhotos" as keyof Step3FormData,
    title: "Foto Bangunan",
    description: "Foto eksterior dan tampak depan kos",
    icon: Building2,
    required: true,
    maxFiles: 10,
    examples: ["Tampak depan", "Tampak samping", "Area parkir", "Gerbang masuk"],
  },
  {
    key: "sharedFacilitiesPhotos" as keyof Step3FormData,
    title: "Foto Fasilitas Bersama",
    description: "Foto ruang bersama dan fasilitas umum",
    icon: Users,
    required: false,
    maxFiles: 15,
    examples: ["Ruang tamu", "Dapur bersama", "Ruang cuci", "Taman", "Mushola"],
  },
  {
    key: "floorPlanPhotos" as keyof Step3FormData,
    title: "Denah Lantai",
    description: "Denah atau layout bangunan",
    icon: Map,
    required: false,
    maxFiles: 5,
    examples: ["Denah lantai 1", "Denah lantai 2", "Layout keseluruhan"],
  },
];

export function Step3Images({ onDataChange, initialData }: Step3ImagesProps) {
  const { setStepValid } = useMultiStepForm();
  const [uploads, setUploads] = useState<Record<string, ImageUpload[]>>({
    buildingPhotos: [],
    sharedFacilitiesPhotos: [],
    floorPlanPhotos: [],
  });
  
  const form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      buildingPhotos: initialData?.buildingPhotos || [],
      sharedFacilitiesPhotos: initialData?.sharedFacilitiesPhotos || [],
      floorPlanPhotos: initialData?.floorPlanPhotos || [],
    },
  });

  const watchedData = form.watch();

  // Validate form and update step validity
  useEffect(() => {
    const isValid = form.formState.isValid;
    setStepValid(2, isValid);
    
    if (isValid) {
      onDataChange(watchedData);
      // Persist form data
      FormPersistence.saveFormData({
        key: "property-creation-step-3",
        useSessionStorage: true,
      }, watchedData);
    }
  }, [watchedData, form.formState.isValid, setStepValid, onDataChange]);

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step3FormData>({
      key: "property-creation-step-3",
      useSessionStorage: true,
    });

    if (persistedData && !initialData) {
      form.reset(persistedData);
    }
  }, [form, initialData]);

  // Handle file selection
  const handleFileSelect = (category: keyof Step3FormData, files: FileList | null) => {
    if (!files) return;

    const categoryConfig = imageCategories.find(cat => cat.key === category);
    if (!categoryConfig) return;

    const currentUploads = uploads[category] || [];
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
      [category]: [...currentUploads, ...newUploads],
    }));

    // Start uploading
    uploadFiles(category, newUploads);
  };

  // Upload files to Cloudinary
  const uploadFiles = async (category: keyof Step3FormData, newUploads: ImageUpload[]) => {
    const categoryUploads = uploads[category] || [];
    
    for (let i = 0; i < newUploads.length; i++) {
      const uploadIndex = categoryUploads.length + i;
      
      // Mark as uploading
      setUploads(prev => ({
        ...prev,
        [category]: prev[category].map((upload, idx) => 
          idx === uploadIndex ? { ...upload, uploading: true } : upload
        ),
      }));

      try {
        const formData = new FormData();
        formData.append('file', newUploads[i].file);
        formData.append('upload_preset', 'property_images'); // You need to create this preset in Cloudinary
        formData.append('folder', `properties/${category}`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dg0ybxdbt/image/upload`, // Replace with your cloud name
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        // Mark as uploaded and save URL
        setUploads(prev => ({
          ...prev,
          [category]: prev[category].map((upload, idx) => 
            idx === uploadIndex 
              ? { ...upload, uploading: false, uploaded: true, url: data.secure_url }
              : upload
          ),
        }));

        // Update form data
        const currentUrls = form.getValues(category) || [];
        form.setValue(category, [...currentUrls, data.secure_url]);

      } catch (error) {
        console.error('Upload error:', error);
        
        // Mark as error
        setUploads(prev => ({
          ...prev,
          [category]: prev[category].map((upload, idx) => 
            idx === uploadIndex 
              ? { ...upload, uploading: false, error: 'Upload gagal' }
              : upload
          ),
        }));

        toast.error(`Gagal upload ${newUploads[i].file.name}`);
      }
    }
  };

  // Remove image
  const removeImage = (category: keyof Step3FormData, index: number) => {
    const categoryUploads = uploads[category] || [];
    const upload = categoryUploads[index];
    
    // Revoke object URL to prevent memory leaks
    if (upload.preview) {
      URL.revokeObjectURL(upload.preview);
    }

    // Remove from uploads
    setUploads(prev => ({
      ...prev,
      [category]: prev[category].filter((_, idx) => idx !== index),
    }));

    // Remove from form data
    const currentUrls = form.getValues(category) || [];
    const newUrls = currentUrls.filter((_, idx) => idx !== index);
    form.setValue(category, newUrls);
  };

  // Retry upload
  const retryUpload = (category: keyof Step3FormData, index: number) => {
    const upload = uploads[category][index];
    if (upload && upload.error) {
      uploadFiles(category, [upload]);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {imageCategories.map((categoryConfig) => {
          const Icon = categoryConfig.icon;
          const categoryUploads = uploads[categoryConfig.key] || [];
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
                      id={`upload-${categoryConfig.key}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.getElementById(`upload-${categoryConfig.key}`)?.click()}
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
                              onClick={() => retryUpload(categoryConfig.key, index)}
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
                  name={categoryConfig.key}
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
      </div>
    </Form>
  );
}
