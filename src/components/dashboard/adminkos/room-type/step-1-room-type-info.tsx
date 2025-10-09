"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const step1Schema = z.object({
  roomType: z.string().min(1, "Nama jenis kamar harus diisi").max(100, "Nama terlalu panjang"),
  totalRooms: z.coerce.number().int().min(1, "Minimal 1 kamar").max(100, "Maksimal 100 kamar"),
  floor: z.coerce.number().int().min(1, "Lantai minimal 1").max(50, "Lantai maksimal 50"),
  size: z.string().max(50, "Ukuran terlalu panjang").optional(),
});

export type Step1Data = z.infer<typeof step1Schema>;

interface Step1RoomTypeInfoProps {
  onDataChange: (data: Step1Data) => void;
  initialData?: Partial<Step1Data>;
}

export function Step1RoomTypeInfo({ onDataChange, initialData }: Step1RoomTypeInfoProps) {
  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      roomType: initialData?.roomType || "",
      totalRooms: initialData?.totalRooms || 1,
      floor: initialData?.floor || 1,
      size: initialData?.size || "",
    },
    mode: "onChange",
  });

  const { watch } = form;

  // Watch all fields and notify parent
  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange(value as Step1Data);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
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
      </form>
    </Form>
  );
}

