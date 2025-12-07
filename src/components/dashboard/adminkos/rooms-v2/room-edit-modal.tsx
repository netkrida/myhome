"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const editRoomSchema = z.object({
  roomType: z.string().min(1, "Tipe kamar harus diisi"),
  floor: z.coerce.number().int().positive("Lantai harus lebih dari 0"),
  monthlyPrice: z.coerce.number().positive("Harga bulanan harus lebih dari 0"),
  dailyPrice: z.coerce.number().positive("Harga harian harus lebih dari 0").nullable().optional(),
  weeklyPrice: z.coerce.number().positive("Harga mingguan harus lebih dari 0").nullable().optional(),
  quarterlyPrice: z.coerce.number().positive("Harga 3 bulan harus lebih dari 0").nullable().optional(),
  yearlyPrice: z.coerce.number().positive("Harga tahunan harus lebih dari 0").nullable().optional(),
  isAvailable: z.boolean(),
});

type EditRoomFormData = z.infer<typeof editRoomSchema>;

interface RoomEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    floor: number;
    monthlyPrice: number;
    dailyPrice: number | null;
    weeklyPrice: number | null;
    quarterlyPrice: number | null;
    yearlyPrice: number | null;
    isAvailable: boolean;
  } | null;
}

export function RoomEditModal({
  isOpen,
  onClose,
  onSuccess,
  room,
}: RoomEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllPrices, setShowAllPrices] = useState(false);

  const form = useForm<EditRoomFormData>({
    resolver: zodResolver(editRoomSchema),
    defaultValues: {
      roomType: "",
      floor: 1,
      monthlyPrice: 0,
      dailyPrice: null,
      weeklyPrice: null,
      quarterlyPrice: null,
      yearlyPrice: null,
      isAvailable: true,
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        roomType: room.roomType,
        floor: room.floor,
        monthlyPrice: room.monthlyPrice,
        dailyPrice: room.dailyPrice,
        weeklyPrice: room.weeklyPrice,
        quarterlyPrice: room.quarterlyPrice,
        yearlyPrice: room.yearlyPrice,
        isAvailable: room.isAvailable,
      });
    }
              {/* Room Status */}
              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Kamar</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? "available" : "unavailable"}
                        onValueChange={val => field.onChange(val === "available")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Tersedia</SelectItem>
                          <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  }, [room, form]);

  const onSubmit = async (data: EditRoomFormData) => {
    if (!room) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/adminkos/rooms/${room.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Kamar berhasil diperbarui");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Gagal memperbarui kamar");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      toast.error("Terjadi kesalahan saat memperbarui kamar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Kamar</DialogTitle>
          <DialogDescription>
            {room && `Kamar #${room.roomNumber}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Room Status */}
            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Kamar</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? "available" : "unavailable"}
                      onValueChange={val => field.onChange(val === "available")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status kamar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Tersedia</SelectItem>
                        <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormLabel>Tipe Kamar</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Standard, Deluxe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Floor */}
            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lantai</FormLabel>
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
                  <FormLabel>Harga Bulanan (Rp)</FormLabel>
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
                      <FormLabel>Harga Harian (Rp) - Opsional</FormLabel>
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
                      <FormLabel>Harga Mingguan (Rp) - Opsional</FormLabel>
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
                      <FormLabel>Harga 3 Bulan (Rp) - Opsional</FormLabel>
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
                      <FormLabel>Harga Tahunan (Rp) - Opsional</FormLabel>
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
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

