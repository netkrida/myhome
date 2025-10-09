"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ImageIcon } from "lucide-react";

const addRoomSchema = z.object({
  propertyId: z.string().min(1, "Properti harus dipilih"),
  roomNumber: z.string().min(1, "Nomor kamar harus diisi").max(50, "Nomor kamar terlalu panjang"),
  roomType: z.string().min(1, "Tipe kamar harus diisi").max(100, "Tipe kamar terlalu panjang"),
  floor: z.coerce.number().int().positive("Lantai harus lebih dari 0"),
  monthlyPrice: z.coerce.number().positive("Harga bulanan harus lebih dari 0"),
  description: z.string().optional(),
  size: z.string().max(50, "Ukuran terlalu panjang").optional(),
  dailyPrice: z.coerce.number().positive("Harga harian harus lebih dari 0").nullable().optional(),
  weeklyPrice: z.coerce.number().positive("Harga mingguan harus lebih dari 0").nullable().optional(),
  quarterlyPrice: z.coerce.number().positive("Harga 3 bulan harus lebih dari 0").nullable().optional(),
  yearlyPrice: z.coerce.number().positive("Harga tahunan harus lebih dari 0").nullable().optional(),
  facilities: z.array(z.any()).default([]),
  isAvailable: z.boolean().default(true),
});

type AddRoomFormData = {
  propertyId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  description?: string;
  size?: string;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  quarterlyPrice?: number | null;
  yearlyPrice?: number | null;
  facilities: any[];
  isAvailable: boolean;
};

interface Property {
  id: string;
  name: string;
}

interface RoomTypeDetail {
  roomType: string;
  description?: string;
  size?: string;
  facilities: any[];
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  images: Array<{
    imageUrl: string;
    category: string;
  }>;
}

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  properties: Property[];
  preselectedPropertyId?: string | null;
}

export function AddRoomModal({
  isOpen,
  onClose,
  onSuccess,
  properties,
  preselectedPropertyId,
}: AddRoomModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllPrices, setShowAllPrices] = useState(false);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId || "");
  const [roomTypeDetail, setRoomTypeDetail] = useState<RoomTypeDetail | null>(null);
  const [isLoadingRoomTypeDetail, setIsLoadingRoomTypeDetail] = useState(false);

  const form = useForm<AddRoomFormData>({
    defaultValues: {
      propertyId: preselectedPropertyId || "",
      roomNumber: "",
      roomType: "",
      floor: 1,
      monthlyPrice: 0,
      dailyPrice: null,
      weeklyPrice: null,
      quarterlyPrice: null,
      yearlyPrice: null,
      description: "",
      size: "",
      isAvailable: true,
      facilities: [],
    },
  });

  useEffect(() => {
    if (preselectedPropertyId) {
      form.setValue("propertyId", preselectedPropertyId);
      setSelectedPropertyId(preselectedPropertyId);
    }
  }, [preselectedPropertyId, form]);

  // Fetch room types when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchRoomTypes(selectedPropertyId);
    } else {
      setRoomTypes([]);
    }
  }, [selectedPropertyId]);

  const fetchRoomTypes = async (propertyId: string) => {
    setIsLoadingRoomTypes(true);
    try {
      const response = await fetch(`/api/adminkos/properties/${propertyId}/room-types`);
      const result = await response.json();

      if (result.success && result.data.roomTypes) {
        setRoomTypes(result.data.roomTypes);
      } else {
        setRoomTypes([]);
      }
    } catch (error) {
      console.error("Error fetching room types:", error);
      setRoomTypes([]);
    } finally {
      setIsLoadingRoomTypes(false);
    }
  };

  const fetchRoomTypeDetail = async (propertyId: string, roomType: string) => {
    setIsLoadingRoomTypeDetail(true);
    try {
      const response = await fetch(
        `/api/adminkos/properties/${propertyId}/room-types/${encodeURIComponent(roomType)}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const detail = result.data;
        setRoomTypeDetail(detail);

        // Auto-fill form fields
        form.setValue("description", detail.description || "");
        form.setValue("size", detail.size || "");
        form.setValue("facilities", detail.facilities || []);
        form.setValue("monthlyPrice", detail.monthlyPrice);
        form.setValue("dailyPrice", detail.dailyPrice || null);
        form.setValue("weeklyPrice", detail.weeklyPrice || null);
        form.setValue("quarterlyPrice", detail.quarterlyPrice || null);
        form.setValue("yearlyPrice", detail.yearlyPrice || null);

        // Show all prices if any optional price exists
        if (detail.dailyPrice || detail.weeklyPrice || detail.quarterlyPrice || detail.yearlyPrice) {
          setShowAllPrices(true);
        }
      } else {
        setRoomTypeDetail(null);
      }
    } catch (error) {
      console.error("Error fetching room type detail:", error);
      setRoomTypeDetail(null);
    } finally {
      setIsLoadingRoomTypeDetail(false);
    }
  };

  const onSubmit = async (data: AddRoomFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/adminkos/rooms/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Kamar berhasil ditambahkan");
        form.reset();
        onSuccess();
        onClose();
      } else {
        if (result.error?.code === "ROOM_NUMBER_EXISTS") {
          toast.error("Nomor kamar sudah ada di properti ini");
        } else {
          toast.error(result.error?.message || "Gagal menambahkan kamar");
        }
      }
    } catch (error) {
      console.error("Error adding room:", error);
      toast.error("Terjadi kesalahan saat menambahkan kamar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Kamar Baru</DialogTitle>
          <DialogDescription>
            Tambahkan kamar baru ke properti yang dipilih
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Property Selection */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Properti *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedPropertyId(value);
                      form.setValue("roomType", ""); // Reset room type when property changes
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih properti" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Room Number */}
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Kamar *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 101, A1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nomor kamar harus unik dalam satu properti
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Room Type */}
            <FormField
              control={form.control}
              name="roomType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Kamar *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Fetch room type detail when selected
                      if (value && selectedPropertyId) {
                        fetchRoomTypeDetail(selectedPropertyId, value);
                      } else {
                        setRoomTypeDetail(null);
                      }
                    }}
                    value={field.value}
                    disabled={!selectedPropertyId || isLoadingRoomTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingRoomTypes
                            ? "Memuat tipe kamar..."
                            : !selectedPropertyId
                            ? "Pilih properti terlebih dahulu"
                            : roomTypes.length === 0
                            ? "Belum ada tipe kamar"
                            : "Pilih tipe kamar"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.length > 0 ? (
                        roomTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empty__" disabled>
                          Belum ada tipe kamar di properti ini
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Pilih dari tipe kamar yang sudah ada di properti
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Room Type Photos Preview */}
            {isLoadingRoomTypeDetail && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Memuat detail tipe kamar...</span>
              </div>
            )}

            {roomTypeDetail && roomTypeDetail.images.length > 0 && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Foto Tipe Kamar</h4>
                  <Badge variant="secondary" className="ml-auto">
                    {roomTypeDetail.images.length} foto
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {roomTypeDetail.images.slice(0, 6).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-md border bg-muted"
                    >
                      <Image
                        src={img.imageUrl}
                        alt={`${roomTypeDetail.roomType} - ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 150px"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                        <p className="text-[10px] text-white font-medium truncate">
                          {img.category === "ROOM_PHOTOS" ? "Kamar" : "Kamar Mandi"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {roomTypeDetail.images.length > 6 && (
                    <div className="relative aspect-square overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        +{roomTypeDetail.images.length - 6} lainnya
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Semua kamar dengan tipe <strong>{roomTypeDetail.roomType}</strong> memiliki foto yang sama
                </p>
              </div>
            )}

            {/* Floor */}
            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lantai *</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monthly Price */}
            <FormField
              control={form.control}
              name="monthlyPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Bulanan (Rp) *</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Toggle for other prices */}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAllPrices(!showAllPrices)}
              >
                {showAllPrices ? "Sembunyikan" : "Tampilkan"} Opsi Harga Lain
              </Button>
            </div>

            {/* Other Prices */}
            {showAllPrices && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <FormField
                  control={form.control}
                  name="dailyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Harian (Rp)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weeklyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Mingguan (Rp)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quarterlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga 3 Bulan (Rp)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Tahunan (Rp)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
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
                          placeholder="Deskripsi kamar (opsional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Size */}
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ukuran</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 3x4 m" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambah Kamar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

