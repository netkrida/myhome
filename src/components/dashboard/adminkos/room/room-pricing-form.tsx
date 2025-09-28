"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { DepositPercentage } from "@/server/types/room";

const pricingSchema = z.object({
  dailyPrice: z.number().min(0, "Harga harian tidak boleh negatif").optional(),
  weeklyPrice: z.number().min(0, "Harga mingguan tidak boleh negatif").optional(),
  monthlyPrice: z.number().min(0, "Harga bulanan tidak boleh negatif").optional(),
  quarterlyPrice: z.number().min(0, "Harga 3 bulanan tidak boleh negatif").optional(),
  yearlyPrice: z.number().min(0, "Harga tahunan tidak boleh negatif").optional(),
  depositPercentage: z.nativeEnum(DepositPercentage, {
    errorMap: () => ({ message: "Pilih persentase deposit" })
  }),
}).refine((data) => {
  // At least one price must be provided
  const hasPricing = data.dailyPrice || data.weeklyPrice || data.monthlyPrice || 
                    data.quarterlyPrice || data.yearlyPrice;
  return hasPricing;
}, {
  message: "Minimal satu jenis harga harus diisi",
  path: ["monthlyPrice"], // Show error on monthly price field
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface RoomPricingFormProps {
  onDataChange: (data: PricingFormData) => void;
  initialData?: Partial<PricingFormData>;
  className?: string;
}

const depositOptions = [
  { value: DepositPercentage.TEN_PERCENT, label: "10%", description: "Deposit 10% dari harga sewa" },
  { value: DepositPercentage.TWENTY_PERCENT, label: "20%", description: "Deposit 20% dari harga sewa" },
  { value: DepositPercentage.THIRTY_PERCENT, label: "30%", description: "Deposit 30% dari harga sewa" },
  { value: DepositPercentage.FORTY_PERCENT, label: "40%", description: "Deposit 40% dari harga sewa" },
  { value: DepositPercentage.FIFTY_PERCENT, label: "50%", description: "Deposit 50% dari harga sewa" },
];

// Helper function to get numeric value from DepositPercentage enum
const getDepositPercentageValue = (percentage: DepositPercentage): number => {
  switch (percentage) {
    case DepositPercentage.TEN_PERCENT:
      return 10;
    case DepositPercentage.TWENTY_PERCENT:
      return 20;
    case DepositPercentage.THIRTY_PERCENT:
      return 30;
    case DepositPercentage.FORTY_PERCENT:
      return 40;
    case DepositPercentage.FIFTY_PERCENT:
      return 50;
    default:
      return 0;
  }
};

const priceFields = [
  {
    key: "dailyPrice" as keyof PricingFormData,
    label: "Harga Harian",
    description: "Harga sewa per hari",
    placeholder: "50000",
    period: "hari",
  },
  {
    key: "weeklyPrice" as keyof PricingFormData,
    label: "Harga Mingguan",
    description: "Harga sewa per minggu",
    placeholder: "300000",
    period: "minggu",
  },
  {
    key: "monthlyPrice" as keyof PricingFormData,
    label: "Harga Bulanan",
    description: "Harga sewa per bulan (paling umum)",
    placeholder: "1000000",
    period: "bulan",
    recommended: true,
  },
  {
    key: "quarterlyPrice" as keyof PricingFormData,
    label: "Harga 3 Bulanan",
    description: "Harga sewa per 3 bulan",
    placeholder: "2800000",
    period: "3 bulan",
  },
  {
    key: "yearlyPrice" as keyof PricingFormData,
    label: "Harga Tahunan",
    description: "Harga sewa per tahun",
    placeholder: "10000000",
    period: "tahun",
  },
];

export function RoomPricingForm({ onDataChange, initialData, className }: RoomPricingFormProps) {
  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      dailyPrice: initialData?.dailyPrice || undefined,
      weeklyPrice: initialData?.weeklyPrice || undefined,
      monthlyPrice: initialData?.monthlyPrice || undefined,
      quarterlyPrice: initialData?.quarterlyPrice || undefined,
      yearlyPrice: initialData?.yearlyPrice || undefined,
      depositPercentage: initialData?.depositPercentage || DepositPercentage.TWENTY_PERCENT,
    },
  });

  const watchedData = form.watch();

  // Update parent component when data changes
  useEffect(() => {
    if (form.formState.isValid) {
      onDataChange(watchedData);
    }
  }, [watchedData, form.formState.isValid, onDataChange]);

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate deposit amount
  const calculateDeposit = (price: number, percentage: DepositPercentage) => {
    const percentValue = getDepositPercentageValue(percentage);
    return (price * percentValue) / 100;
  };

  // Get filled prices for deposit calculation
  const getFilledPrices = () => {
    const prices: { label: string; amount: number; period: string }[] = [];
    
    priceFields.forEach(field => {
      const value = watchedData[field.key];
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (numValue && numValue > 0) {
        prices.push({
          label: field.label,
          amount: numValue,
          period: field.period,
        });
      }
    });
    
    return prices;
  };

  const filledPrices = getFilledPrices();
  const depositPercentage = watchedData.depositPercentage;

  return (
    <Form {...form}>
      <div className={cn("space-y-6", className)}>
        {/* Pricing Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Harga Sewa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceFields.map((field) => (
                <FormField
                  key={field.key}
                  control={form.control}
                  name={field.key}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {field.label}
                        {field.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Direkomendasikan
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            Rp
                          </span>
                          <Input
                            type="number"
                            placeholder={field.placeholder}
                            className="pl-10"
                            {...formField}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              formField.onChange(value);
                            }}
                            value={formField.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {field.description}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Pricing Summary */}
            {filledPrices.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">Ringkasan Harga</h4>
                <div className="space-y-2">
                  {filledPrices.map((price, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{price.label}:</span>
                      <span className="font-medium">
                        {formatPrice(price.amount)} / {price.period}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Deposit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="depositPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persentase Deposit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih persentase deposit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {depositOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Persentase deposit yang harus dibayar penyewa di muka
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deposit Calculation */}
            {filledPrices.length > 0 && depositPercentage && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">Perhitungan Deposit ({depositOptions.find(o => o.value === depositPercentage)?.label})</h4>
                <div className="space-y-2">
                  {filledPrices.map((price, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Deposit {price.label.toLowerCase()}:
                      </span>
                      <span className="font-medium">
                        {formatPrice(calculateDeposit(price.amount, depositPercentage))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
