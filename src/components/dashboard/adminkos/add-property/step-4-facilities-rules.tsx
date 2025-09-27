"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wifi, 
  Car, 
  Shield, 
  Utensils, 
  Plus, 
  X,
  Home,
  ParkingCircle
} from "lucide-react";
import { useMultiStepForm } from "@/components/ui/multi-step-form";
import { FormPersistence } from "@/lib/form-persistence";
import { 
  PROPERTY_FACILITIES, 
  PARKING_FACILITIES, 
  PROPERTY_RULES 
} from "@/server/types/property";

const step4Schema = z.object({
  propertyFacilities: z.array(z.string()),
  parkingFacilities: z.array(z.string()),
  customFacilities: z.array(z.string()),
  rules: z.array(z.string()),
  customRules: z.array(z.string()),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "Anda harus menyetujui syarat dan ketentuan"
  }),
});

type Step4FormData = z.infer<typeof step4Schema>;

interface Step4FacilitiesRulesProps {
  onDataChange: (data: Step4FormData) => void;
  initialData?: Partial<Step4FormData>;
}

const facilityCategories = [
  {
    key: "propertyFacilities" as keyof Step4FormData,
    title: "Fasilitas Kos",
    icon: Home,
    items: PROPERTY_FACILITIES.property,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  {
    key: "parkingFacilities" as keyof Step4FormData,
    title: "Fasilitas Parkir",
    icon: ParkingCircle,
    items: PROPERTY_FACILITIES.parking,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
];

export function Step4FacilitiesRules({ onDataChange, initialData }: Step4FacilitiesRulesProps) {
  const { setStepValid } = useMultiStepForm();
  const [customFacility, setCustomFacility] = useState("");
  const [customRule, setCustomRule] = useState("");
  
  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      propertyFacilities: initialData?.propertyFacilities || [],
      parkingFacilities: initialData?.parkingFacilities || [],
      customFacilities: initialData?.customFacilities || [],
      rules: initialData?.rules || [],
      customRules: initialData?.customRules || [],
      agreeToTerms: initialData?.agreeToTerms || false,
    },
  });

  // Use ref to track if we've already called onDataChange for current data
  const lastDataRef = useRef<string>("");

  // Watch for form changes and validate
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Only process if we have actual form data
      if (!value) return;
      
      // Use setTimeout to prevent synchronous state updates that could cause infinite loops
      setTimeout(() => {
        const isValid = form.formState.isValid;
        setStepValid(3, isValid);
        
        if (isValid) {
          const currentDataString = JSON.stringify(value);
          
          // Only update if data actually changed
          if (currentDataString !== lastDataRef.current) {
            lastDataRef.current = currentDataString;
            onDataChange(value as Step4FormData);
            
            // Persist form data
            try {
              FormPersistence.saveFormData(
                value as Step4FormData,
                {
                  key: "property-creation-step-4",
                  useSessionStorage: true,
                }
              );
            } catch (error) {
              console.error("Error saving form data:", error);
            }
          }
        }
      }, 0);
    });
    
    return () => subscription.unsubscribe();
  }, [form, setStepValid, onDataChange]);

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step4FormData>({
      key: "property-creation-step-4",
      useSessionStorage: true,
    });

    if (persistedData?.data && !initialData) {
      form.reset(persistedData.data);
    }
  }, [form, initialData]);

  // Handle facility selection
  const handleFacilityChange = (category: keyof Step4FormData, facility: string, checked: boolean) => {
    const currentFacilities = form.getValues(category) as string[] || [];
    if (checked) {
      form.setValue(category, [...currentFacilities, facility] as any);
    } else {
      form.setValue(category, currentFacilities.filter(f => f !== facility) as any);
    }
  };

  // Handle rule selection
  const handleRuleChange = (rule: string, checked: boolean) => {
    const currentRules = form.getValues("rules") || [];
    if (checked) {
      form.setValue("rules", [...currentRules, rule]);
    } else {
      form.setValue("rules", currentRules.filter(r => r !== rule));
    }
  };

  // Add custom facility
  const addCustomFacility = () => {
    if (customFacility.trim()) {
      const currentCustom = form.getValues("customFacilities") || [];
      if (!currentCustom.includes(customFacility.trim())) {
        form.setValue("customFacilities", [...currentCustom, customFacility.trim()]);
        setCustomFacility("");
      }
    }
  };

  // Remove custom facility
  const removeCustomFacility = (facility: string) => {
    const currentCustom = form.getValues("customFacilities") || [];
    form.setValue("customFacilities", currentCustom.filter(f => f !== facility));
  };

  // Add custom rule
  const addCustomRule = () => {
    if (customRule.trim()) {
      const currentCustom = form.getValues("customRules") || [];
      if (!currentCustom.includes(customRule.trim())) {
        form.setValue("customRules", [...currentCustom, customRule.trim()]);
        setCustomRule("");
      }
    }
  };

  // Remove custom rule
  const removeCustomRule = (rule: string) => {
    const currentCustom = form.getValues("customRules") || [];
    form.setValue("customRules", currentCustom.filter(r => r !== rule));
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Tabs defaultValue="facilities" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="facilities" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Fasilitas
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Peraturan
            </TabsTrigger>
          </TabsList>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            {facilityCategories.map((category) => {
              const Icon = category.icon;
              const selectedFacilities = (form.watch(category.key) as string[]) || [];

              return (
                <Card key={category.key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {category.title}
                      <Badge variant="outline" className="ml-auto">
                        {selectedFacilities.length} dipilih
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.items.map((facility) => {
                        const isSelected = selectedFacilities.includes(facility.id);
                        return (
                          <div key={facility.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${category.key}-${facility.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleFacilityChange(category.key, facility.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`${category.key}-${facility.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {facility.name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Custom Facilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Fasilitas Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah fasilitas lainnya..."
                    value={customFacility}
                    onChange={(e) => setCustomFacility(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomFacility();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addCustomFacility}
                    disabled={!customFacility.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Custom Facilities List */}
                {form.watch("customFacilities")?.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel>Fasilitas Tambahan Anda</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {form.watch("customFacilities")?.map((facility) => (
                        <Badge key={facility} variant="secondary" className="flex items-center gap-1">
                          {facility}
                          <button
                            type="button"
                            onClick={() => removeCustomFacility(facility)}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Peraturan Kos
                  <Badge variant="outline" className="ml-auto">
                    {form.watch("rules")?.length || 0} dipilih
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PROPERTY_RULES.map((rule) => {
                    const isSelected = form.watch("rules")?.includes(rule.id) || false;
                    return (
                      <div key={rule.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`rule-${rule.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleRuleChange(rule.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`rule-${rule.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {rule.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Custom Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Peraturan Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah peraturan lainnya..."
                    value={customRule}
                    onChange={(e) => setCustomRule(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomRule();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addCustomRule}
                    disabled={!customRule.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Custom Rules List */}
                {form.watch("customRules")?.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel>Peraturan Tambahan Anda</FormLabel>
                    <div className="space-y-2">
                      {form.watch("customRules")?.map((rule) => (
                        <Badge key={rule} variant="secondary" className="flex items-center gap-1 w-full justify-between p-2">
                          <span className="flex-1 text-left">{rule}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomRule(rule)}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Terms Agreement */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Saya menyetujui syarat dan ketentuan <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormDescription>
                      Dengan mencentang kotak ini, Anda menyetujui bahwa informasi yang diberikan adalah benar dan akurat.
                      Properti akan direview oleh admin sebelum ditampilkan di halaman publik.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
