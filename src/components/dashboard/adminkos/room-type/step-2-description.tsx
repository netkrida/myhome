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
import { Textarea } from "@/components/ui/textarea";

const step2Schema = z.object({
  description: z.string().max(1000, "Deskripsi terlalu panjang (maksimal 1000 karakter)").optional(),
});

export type Step2Data = z.infer<typeof step2Schema>;

interface Step2DescriptionProps {
  onDataChange: (data: Step2Data) => void;
  initialData?: Partial<Step2Data>;
}

export function Step2Description({ onDataChange, initialData }: Step2DescriptionProps) {
  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      description: initialData?.description || "",
    },
    mode: "onChange",
  });

  const { watch, formState: { isValid } } = form;

  // Watch all fields and notify parent
  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange(value as Step2Data);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Jenis Kamar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Deskripsi singkat tentang jenis kamar ini, fasilitas yang tersedia, dan keunggulannya..."
                  rows={8}
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
      </form>
    </Form>
  );
}

