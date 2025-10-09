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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const step5Schema = z.object({
  monthlyPrice: z.coerce.number().positive("Harga bulanan harus lebih dari 0"),
  dailyPrice: z.coerce.number().positive("Harga harian harus lebih dari 0").nullable().optional(),
  weeklyPrice: z.coerce.number().positive("Harga mingguan harus lebih dari 0").nullable().optional(),
  quarterlyPrice: z.coerce.number().positive("Harga 3 bulan harus lebih dari 0").nullable().optional(),
  yearlyPrice: z.coerce.number().positive("Harga tahunan harus lebih dari 0").nullable().optional(),
});

export type Step5Data = z.infer<typeof step5Schema>;

interface Step5PricingProps {
  onDataChange: (data: Step5Data) => void;
  initialData?: Partial<Step5Data>;
}

export function Step5Pricing({ onDataChange, initialData }: Step5PricingProps) {
  const form = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      monthlyPrice: initialData?.monthlyPrice || 0,
      dailyPrice: initialData?.dailyPrice || null,
      weeklyPrice: initialData?.weeklyPrice || null,
      quarterlyPrice: initialData?.quarterlyPrice || null,
      yearlyPrice: initialData?.yearlyPrice || null,
    },
    mode: "onChange",
  });

  const { watch } = form;

  // Watch all fields and notify parent
  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange(value as Step5Data);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Harga Sewa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Monthly Price - Required */}
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

            {/* Daily Price - Optional */}
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

            {/* Weekly Price - Optional */}
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

            {/* Quarterly Price - Optional */}
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

            {/* Yearly Price - Optional */}
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
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Tips menentukan harga:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Riset harga kos di sekitar lokasi Anda</li>
            <li>Pertimbangkan fasilitas yang disediakan</li>
            <li>Berikan diskon untuk sewa jangka panjang</li>
            <li>Harga harus kompetitif namun tetap menguntungkan</li>
          </ul>
        </div>
      </form>
    </Form>
  );
}

