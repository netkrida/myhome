"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Receipt, 
  Calendar,
  Percent,
  DollarSign,
  Clock,
  CalendarDays,
  CalendarRange,
  CalendarCheck
} from "lucide-react";
import { FormPersistence } from "@/lib/form-persistence";
import { toast } from "sonner";
import { createRoomStep3Schema } from "@/server/schemas/room.schemas";
import { DepositPercentage } from "@/server/types/room";
import { useMultiStepForm } from "@/components/ui/multi-step-form";

// Create a form-specific schema with required booleans
const formSchema = z.object({
  pricing: z.record(z.string(), z.object({
    monthlyPrice: z.number().positive("Harga bulanan harus lebih dari 0"),
    dailyPrice: z.number().positive("Harga harian harus lebih dari 0").optional().nullable(),
    weeklyPrice: z.number().positive("Harga mingguan harus lebih dari 0").optional().nullable(),
    quarterlyPrice: z.number().positive("Harga 3 bulan harus lebih dari 0").optional().nullable(),
    yearlyPrice: z.number().positive("Harga tahunan harus lebih dari 0").optional().nullable(),
  })).refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu tipe kamar harus memiliki harga",
  }),
  hasAlternativeRentals: z.boolean(),
  alternativeRentals: z.object({
    daily: z.boolean(),
    weekly: z.boolean(),
    quarterly: z.boolean(),
    yearly: z.boolean(),
  }),
  hasDeposit: z.boolean(),
  depositPercentage: z.nativeEnum(DepositPercentage).optional(),
});

type Step3FormData = z.infer<typeof formSchema>;

interface Step3RoomPricingProps {
  onDataChange: (data: z.infer<typeof createRoomStep3Schema>) => void;
  initialData?: Partial<z.infer<typeof createRoomStep3Schema>>;
  roomTypes: string[];
}

const rentalPeriods = [
  {
    key: "daily" as const,
    label: "1 Hari",
    icon: Clock,
    description: "Sewa harian untuk tamu singkat",
  },
  {
    key: "weekly" as const, 
    label: "1 Minggu",
    icon: CalendarDays,
    description: "Sewa mingguan untuk tamu jangka pendek",
  },
  {
    key: "quarterly" as const,
    label: "3 Bulan",
    icon: CalendarRange,
    description: "Sewa 3 bulan untuk kontrak jangka menengah",
  },
  {
    key: "yearly" as const,
    label: "1 Tahun", 
    icon: CalendarCheck,
    description: "Sewa tahunan untuk kontrak jangka panjang",
  },
];

const depositOptions = [
  { value: DepositPercentage.TEN_PERCENT, label: "10%", description: "10% dari harga sewa bulanan" },
  { value: DepositPercentage.TWENTY_PERCENT, label: "20%", description: "20% dari harga sewa bulanan" },
  { value: DepositPercentage.THIRTY_PERCENT, label: "30%", description: "30% dari harga sewa bulanan" },
  { value: DepositPercentage.FORTY_PERCENT, label: "40%", description: "40% dari harga sewa bulanan" },
  { value: DepositPercentage.FIFTY_PERCENT, label: "50%", description: "50% dari harga sewa bulanan" },
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

export function Step3RoomPricing({ onDataChange, initialData, roomTypes }: Step3RoomPricingProps) {
  const [hasAlternativeRentals, setHasAlternativeRentals] = useState(initialData?.hasAlternativeRentals ?? false);
  const [hasDeposit, setHasDeposit] = useState(initialData?.hasDeposit ?? false);
  const { setStepValid } = useMultiStepForm();

  // Create proper default values for all room types
  const createDefaultPricing = () => {
    const pricing: Record<string, any> = {};
    roomTypes.forEach(roomType => {
      pricing[roomType] = {
        monthlyPrice: undefined,
        dailyPrice: undefined,
        weeklyPrice: undefined,
        quarterlyPrice: undefined,
        yearlyPrice: undefined,
      };
    });
    return pricing;
  };

  const form = useForm<Step3FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pricing: initialData?.pricing || createDefaultPricing(),
      hasAlternativeRentals: initialData?.hasAlternativeRentals ?? false,
      alternativeRentals: {
        daily: initialData?.alternativeRentals?.daily ?? false,
        weekly: initialData?.alternativeRentals?.weekly ?? false,
        quarterly: initialData?.alternativeRentals?.quarterly ?? false,
        yearly: initialData?.alternativeRentals?.yearly ?? false,
      },
      hasDeposit: initialData?.hasDeposit ?? false,
      depositPercentage: initialData?.depositPercentage,
    },
  });

  // Watch specific fields instead of all data to prevent infinite loops
  const pricing = form.watch("pricing");
  const hasAlternativeRentalsValue = form.watch("hasAlternativeRentals");
  const alternativeRentals = form.watch("alternativeRentals");
  const hasDepositValue = form.watch("hasDeposit");
  const depositPercentage = form.watch("depositPercentage");

  // Memoize the converted data to prevent unnecessary re-renders
  const convertedData = useMemo(() => {
    // Clean pricing data - remove undefined/null values for optional fields
    const cleanedPricing: Record<string, any> = {};
    Object.entries(pricing).forEach(([roomType, prices]) => {
      // Only add pricing if monthlyPrice is defined and valid
      if (prices.monthlyPrice !== undefined && prices.monthlyPrice !== null && prices.monthlyPrice > 0) {
        cleanedPricing[roomType] = {
          monthlyPrice: prices.monthlyPrice,
          ...(prices.dailyPrice !== undefined && prices.dailyPrice !== null && { dailyPrice: prices.dailyPrice }),
          ...(prices.weeklyPrice !== undefined && prices.weeklyPrice !== null && { weeklyPrice: prices.weeklyPrice }),
          ...(prices.quarterlyPrice !== undefined && prices.quarterlyPrice !== null && { quarterlyPrice: prices.quarterlyPrice }),
          ...(prices.yearlyPrice !== undefined && prices.yearlyPrice !== null && { yearlyPrice: prices.yearlyPrice }),
        };
      }
    });

    return {
      pricing: cleanedPricing,
      hasAlternativeRentals: hasAlternativeRentalsValue,
      alternativeRentals: hasAlternativeRentalsValue ? alternativeRentals : undefined,
      hasDeposit: hasDepositValue,
      depositPercentage: hasDepositValue ? depositPercentage : undefined,
    };
  }, [pricing, hasAlternativeRentalsValue, alternativeRentals, hasDepositValue, depositPercentage]);

  // Memoize the form data for persistence
  const formDataForPersistence = useMemo(() => ({
    pricing,
    hasAlternativeRentals: hasAlternativeRentalsValue,
    alternativeRentals,
    hasDeposit: hasDepositValue,
    depositPercentage,
  }), [pricing, hasAlternativeRentalsValue, alternativeRentals, hasDepositValue, depositPercentage]);

  // Use ref to prevent infinite loops
  const dataChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidDataRef = useRef<string>("");

  // Handle form validation and data changes
  useEffect(() => {
    // Custom validation: check if all room types have monthlyPrice
    const allRoomTypesHaveMonthlyPrice = roomTypes.every(roomType => {
      const price = pricing?.[roomType]?.monthlyPrice;
      return price !== undefined && price !== null && price > 0;
    });
    
    // Additional validation: if hasDeposit is true, depositPercentage must be set
    const depositValid = !hasDepositValue || (hasDepositValue && depositPercentage !== undefined);
    
    // Check if pricing has at least one valid room type
    const hasPricingData = Object.keys(convertedData.pricing).length > 0;
    
    // Combined validation
    const isValid = form.formState.isValid && allRoomTypesHaveMonthlyPrice && depositValid && hasPricingData;
    
    console.log("🔍 Step3 Validation:", {
      formValid: form.formState.isValid,
      allRoomTypesHaveMonthlyPrice,
      depositValid,
      hasPricingData,
      finalIsValid: isValid,
      pricingKeys: Object.keys(convertedData.pricing),
      convertedData: convertedData
    });
    
    // Update step validity in multi-step form
    setStepValid(2, isValid);
    
    // Always call onDataChange with current data
    const currentDataString = JSON.stringify(convertedData);
    
    // Only call onDataChange if the data actually changed
    if (currentDataString !== lastValidDataRef.current) {
      lastValidDataRef.current = currentDataString;
      
      // Clear existing timeout
      if (dataChangeTimeoutRef.current) {
        clearTimeout(dataChangeTimeoutRef.current);
      }
      
      // Debounce the data change call
      dataChangeTimeoutRef.current = setTimeout(() => {
        console.log("📤 Step3 - Sending data to parent:", convertedData);
        onDataChange(convertedData);
        
        // Only persist when valid
        if (isValid) {
          FormPersistence.saveFormData(formDataForPersistence, {
            key: "room-creation-step-3",
            useSessionStorage: true,
          });
        }
      }, 100);
    }
    
    return () => {
      if (dataChangeTimeoutRef.current) {
        clearTimeout(dataChangeTimeoutRef.current);
      }
    };
  }, [convertedData, formDataForPersistence, form.formState.isValid, onDataChange, setStepValid, roomTypes, pricing, hasDepositValue, depositPercentage]);

  // Load persisted data on mount
  useEffect(() => {
    // Skip loading persisted data to prevent enum conflicts
    console.log("Step3 - Skipping persisted data loading to prevent enum conflicts");

    // Clear any existing persisted data
    FormPersistence.clearFormData({
      key: "room-creation-step-3",
      useSessionStorage: true,
    });

    // Don't load persisted data - start fresh to prevent enum conflicts
  }, []);

  // Initial validation check
  useEffect(() => {
    // Custom validation: check if all room types have monthlyPrice
    const allRoomTypesHaveMonthlyPrice = roomTypes.every(roomType => {
      const price = pricing?.[roomType]?.monthlyPrice;
      return price !== undefined && price !== null && price > 0;
    });
    
    // Additional validation: if hasDeposit is true, depositPercentage must be set
    const depositValid = !hasDepositValue || (hasDepositValue && depositPercentage !== undefined);
    
    // Check if pricing has at least one valid room type
    const hasPricingData = Object.keys(convertedData.pricing).length > 0;
    
    // Combined validation
    const isValid = form.formState.isValid && allRoomTypesHaveMonthlyPrice && depositValid && hasPricingData;
    
    setStepValid(2, isValid);
  }, [form.formState.isValid, setStepValid, roomTypes, pricing, hasDepositValue, depositPercentage, convertedData.pricing]);

  // Send initial data on mount (runs once) - only if we have initialData
  useEffect(() => {
    // Only send initial data if we have valid pricing from initialData
    if (initialData?.pricing && Object.keys(initialData.pricing).length > 0) {
      console.log("📤 Step3 - Sending initial data on mount:", convertedData);
      onDataChange(convertedData);
    } else {
      console.log("⚠️ Step3 - Skipping initial data send (no valid pricing)");
    }
  }, []); // Empty deps to run only once on mount

  // Handle alternative rentals toggle
  const handleAlternativeRentalsToggle = (checked: boolean) => {
    setHasAlternativeRentals(checked);
    form.setValue("hasAlternativeRentals", checked, { shouldValidate: true });

    if (!checked) {
      form.setValue("alternativeRentals", {
        daily: false,
        weekly: false,
        quarterly: false,
        yearly: false,
      }, { shouldValidate: true });
    }
  };

  // Handle deposit toggle
  const handleDepositToggle = (checked: boolean) => {
    setHasDeposit(checked);
    form.setValue("hasDeposit", checked, { shouldValidate: true });

    if (!checked) {
      form.setValue("depositPercentage", undefined, { shouldValidate: true });
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Harga Kamar</h2>
          <p className="text-muted-foreground mt-2">
            Tentukan harga sewa untuk setiap jenis kamar
          </p>
        </div>

        {/* Warning if no pricing data */}
        {Object.keys(convertedData.pricing).length === 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <Receipt className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive mb-1">
                    Harga Bulanan Belum Diisi
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Anda harus mengisi harga sewa bulanan untuk semua jenis kamar sebelum melanjutkan ke langkah berikutnya.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Pricing per Room Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Harga Bulanan per Jenis Kamar
              <Badge variant="destructive" className="ml-2">Wajib</Badge>
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Harga sewa bulanan untuk setiap jenis kamar (wajib diisi)
              </p>
              <Badge variant={Object.keys(convertedData.pricing).length === roomTypes.length ? "default" : "secondary"}>
                {Object.keys(convertedData.pricing).length} / {roomTypes.length} selesai
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {roomTypes.map((roomType) => {
              const monthlyPrice = pricing?.[roomType]?.monthlyPrice;
              const hasPrice = monthlyPrice !== undefined && monthlyPrice !== null && monthlyPrice > 0;
              
              return (
                <div key={roomType} className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg ${!hasPrice ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {roomType}
                      {!hasPrice && <Badge variant="destructive" className="text-xs">Wajib diisi</Badge>}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Harga sewa per bulan untuk {roomType}
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name={`pricing.${roomType}.monthlyPrice` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="Masukkan harga bulanan"
                              className="pl-10"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only set value if it's a valid positive number
                                if (value === "" || value === "0") {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(numValue > 0 ? numValue : undefined);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {!hasPrice && (
                          <p className="text-xs text-destructive mt-1">
                            Harga bulanan harus diisi untuk melanjutkan
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alternative Rental Periods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Opsi Sewa Lainnya
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={hasAlternativeRentals}
                onCheckedChange={handleAlternativeRentalsToggle}
              />
              <Label className="text-sm">
                Menyediakan sewa selain perbulan
              </Label>
            </div>
          </CardHeader>
          {hasAlternativeRentals && (
            <CardContent className="space-y-6">
              {rentalPeriods.map((period) => {
                const Icon = period.icon;
                return (
                  <div key={period.key} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name={`alternativeRentals.${period.key}` as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <Label className="text-sm font-medium">
                                {period.label}
                              </Label>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {alternativeRentals?.[period.key] && (
                      <div className="ml-6 space-y-4">
                        <p className="text-xs text-muted-foreground">
                          {period.description}
                        </p>
                        {roomTypes.map((roomType) => (
                          <div key={roomType} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">{roomType}</Label>
                              <p className="text-xs text-muted-foreground">
                                Harga {period.label.toLowerCase()}
                              </p>
                            </div>
                            <FormField
                              control={form.control}
                              name={`pricing.${roomType}.${period.key}Price` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        placeholder={`Masukkan harga ${period.label.toLowerCase()}`}
                                        className="pl-10"
                                        value={field.value || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          // Only set value if it's a valid positive number
                                          if (value === "" || value === "0") {
                                            field.onChange(undefined);
                                          } else {
                                            const numValue = Number(value);
                                            field.onChange(numValue > 0 ? numValue : undefined);
                                          }
                                        }}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>

        {/* Deposit Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Deposit (Uang Muka)
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={hasDeposit}
                onCheckedChange={handleDepositToggle}
              />
              <Label className="text-sm">
                Menyediakan sistem deposit
              </Label>
            </div>
          </CardHeader>
          {hasDeposit && (
            <CardContent className="space-y-4">
              {/* Warning if deposit enabled but not selected */}
              {!depositPercentage && (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <Percent className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-destructive text-sm mb-1">
                          Persentase Deposit Belum Dipilih
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Karena Anda mengaktifkan sistem deposit, Anda harus memilih persentase deposit sebelum melanjutkan.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <FormField
                control={form.control}
                name="depositPercentage"
                render={({ field }) => {
                  const hasValue = field.value !== undefined && field.value !== null;
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Persentase Deposit
                        {!hasValue && <Badge variant="destructive" className="text-xs">Wajib pilih salah satu</Badge>}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                        >
                          {depositOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={option.value} />
                              <Label htmlFor={option.value} className="text-sm">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Pilih persentase deposit yang akan dikenakan kepada penyewa
                      </FormDescription>
                      {!hasValue && (
                        <p className="text-xs text-destructive mt-1">
                          Pilih persentase deposit untuk melanjutkan
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          )}
        </Card>

        {/* Pricing Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Harga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roomTypes.map((roomType) => {
                const monthlyPrice = pricing?.[roomType]?.monthlyPrice;
                const currentDepositPercentage = depositPercentage;
                
                if (!monthlyPrice) return null;

                const depositAmount = hasDeposit && currentDepositPercentage
                  ? (monthlyPrice * getDepositPercentageValue(currentDepositPercentage)) / 100
                  : 0;

                return (
                  <div key={roomType} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{roomType}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Harga Bulanan:</p>
                        <p className="font-medium">{formatCurrency(monthlyPrice)}</p>
                      </div>
                      {hasDeposit && depositAmount > 0 && (
                        <div>
                          <p className="text-muted-foreground">Deposit:</p>
                          <p className="font-medium">{formatCurrency(depositAmount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
