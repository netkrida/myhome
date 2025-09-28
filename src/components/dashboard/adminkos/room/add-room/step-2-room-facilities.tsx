"use client";

import { useEffect, useState, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Bed, 
  Bath,
  CheckCircle2,
  Circle
} from "lucide-react";
import { FormPersistence } from "@/lib/form-persistence";
import { toast } from "sonner";
import { createRoomStep2Schema } from "@/server/schemas/room.schemas";
import { ROOM_FACILITIES } from "@/server/types/room";
import { useMultiStepForm } from "@/components/ui/multi-step-form";

type Step2FormData = z.infer<typeof createRoomStep2Schema>;

interface Step2RoomFacilitiesProps {
  onDataChange: (data: Step2FormData) => void;
  initialData?: Partial<Step2FormData>;
}

export function Step2RoomFacilities({ onDataChange, initialData }: Step2RoomFacilitiesProps) {
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const { setStepValid } = useMultiStepForm();

  // Use refs to prevent infinite loops
  const previousDataRef = useRef<string>("");
  const previousValidityRef = useRef<boolean>(false);

  const form = useForm<Step2FormData>({
    resolver: zodResolver(createRoomStep2Schema),
    defaultValues: {
      facilities: initialData?.facilities || [],
    },
  });

  const watchedData = form.watch();

  // Handle form validation and data changes with refs to prevent infinite loops
  useEffect(() => {
    const isValid = form.formState.isValid;
    const currentDataString = JSON.stringify(watchedData);

    // Only update step validity if it has changed
    if (previousValidityRef.current !== isValid) {
      setStepValid(1, isValid);
      previousValidityRef.current = isValid;
    }

    // Only call onDataChange and persist if data has actually changed
    if (previousDataRef.current !== currentDataString) {
      onDataChange(watchedData);
      previousDataRef.current = currentDataString;

      // Only persist when valid
      if (isValid) {
        FormPersistence.saveFormData(watchedData, {
          key: "room-creation-step-2",
          useSessionStorage: true,
        });
      }
    }
  });

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step2FormData>({
      key: "room-creation-step-2",
      useSessionStorage: true,
    });

    if (persistedData?.data && !initialData) {
      form.reset(persistedData.data);
      setSelectedFacilities(persistedData.data.facilities.map(f => f.id));
    }
  }, [form, initialData]);

  // Initial validation check
  useEffect(() => {
    const isValid = form.formState.isValid;
    setStepValid(1, isValid);
  }, [form.formState.isValid, setStepValid]);

  // Send initial data on mount (runs once)
  useEffect(() => {
    const currentData = form.getValues();
    onDataChange(currentData);
  }, []); // Empty deps to run only once on mount

  // Initialize selected facilities from form data
  useEffect(() => {
    const facilities = form.getValues("facilities");
    if (facilities && facilities.length > 0) {
      setSelectedFacilities(facilities.map(f => f.id));
    }
  }, [form]);

  // Handle facility selection
  const handleFacilityToggle = (facilityId: string, checked: boolean) => {
    const facility = ROOM_FACILITIES.find(f => f.id === facilityId);
    if (!facility) return;

    let newSelectedFacilities: string[];
    let newFacilities: typeof ROOM_FACILITIES;

    if (checked) {
      newSelectedFacilities = [...selectedFacilities, facilityId];
      newFacilities = [...form.getValues("facilities"), facility];
    } else {
      newSelectedFacilities = selectedFacilities.filter(id => id !== facilityId);
      newFacilities = form.getValues("facilities").filter(f => f.id !== facilityId);
    }

    setSelectedFacilities(newSelectedFacilities);
    form.setValue("facilities", newFacilities, { shouldValidate: true });
  };

  // Select all facilities in a category
  const selectAllInCategory = (category: 'room' | 'bathroom') => {
    const categoryFacilities = ROOM_FACILITIES.filter(f => f.category === category);
    const categoryIds = categoryFacilities.map(f => f.id);
    const otherCategorySelected = selectedFacilities.filter(id =>
      !categoryIds.includes(id)
    );

    const newSelectedFacilities = [...otherCategorySelected, ...categoryIds];
    const newFacilities = ROOM_FACILITIES.filter(f =>
      newSelectedFacilities.includes(f.id)
    );

    setSelectedFacilities(newSelectedFacilities);
    form.setValue("facilities", newFacilities, { shouldValidate: true });
  };

  // Clear all facilities in a category
  const clearAllInCategory = (category: 'room' | 'bathroom') => {
    const categoryFacilities = ROOM_FACILITIES.filter(f => f.category === category);
    const categoryIds = categoryFacilities.map(f => f.id);
    const newSelectedFacilities = selectedFacilities.filter(id =>
      !categoryIds.includes(id)
    );
    const newFacilities = ROOM_FACILITIES.filter(f =>
      newSelectedFacilities.includes(f.id)
    );

    setSelectedFacilities(newSelectedFacilities);
    form.setValue("facilities", newFacilities, { shouldValidate: true });
  };

  // Get facilities by category
  const roomFacilities = ROOM_FACILITIES.filter(f => f.category === 'room');
  const bathroomFacilities = ROOM_FACILITIES.filter(f => f.category === 'bathroom');

  // Count selected facilities by category
  const selectedRoomCount = roomFacilities.filter(f => selectedFacilities.includes(f.id)).length;
  const selectedBathroomCount = bathroomFacilities.filter(f => selectedFacilities.includes(f.id)).length;

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Fasilitas Kamar</h2>
          <p className="text-muted-foreground mt-2">
            Pilih fasilitas yang tersedia di kamar dan kamar mandi
          </p>
        </div>

        {/* Room Facilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              🛋️ Fasilitas Kamar
              <Badge variant="outline" className="ml-auto">
                {selectedRoomCount}/{roomFacilities.length}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => selectAllInCategory('room')}
              >
                Pilih Semua
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => clearAllInCategory('room')}
              >
                Hapus Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomFacilities.map((facility) => {
                const isSelected = selectedFacilities.includes(facility.id);
                return (
                  <div
                    key={facility.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/5 border-primary' 
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                    onClick={() => handleFacilityToggle(facility.id, !isSelected)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleFacilityToggle(facility.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{facility.name}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bathroom Facilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bath className="h-5 w-5" />
              🚿 Fasilitas Kamar Mandi
              <Badge variant="outline" className="ml-auto">
                {selectedBathroomCount}/{bathroomFacilities.length}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => selectAllInCategory('bathroom')}
              >
                Pilih Semua
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => clearAllInCategory('bathroom')}
              >
                Hapus Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bathroomFacilities.map((facility) => {
                const isSelected = selectedFacilities.includes(facility.id);
                return (
                  <div
                    key={facility.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/5 border-primary' 
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                    onClick={() => handleFacilityToggle(facility.id, !isSelected)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleFacilityToggle(facility.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{facility.name}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Total fasilitas dipilih: <span className="font-medium">{selectedFacilities.length}</span>
              </p>
              <div className="flex justify-center gap-4 mt-2">
                <Badge variant="secondary">
                  Kamar: {selectedRoomCount}
                </Badge>
                <Badge variant="secondary">
                  Kamar Mandi: {selectedBathroomCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Field for Validation */}
        <FormField
          control={form.control}
          name="facilities"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
