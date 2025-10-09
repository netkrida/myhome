"use client";

import { useEffect, useState } from "react";
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
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bed, Bath, CheckCircle2 } from "lucide-react";
import { ROOM_FACILITIES, type RoomFacility } from "@/server/types/room";

const step4Schema = z.object({
  facilities: z.array(z.any()).min(1, "Pilih minimal 1 fasilitas"),
});

export type Step4Data = z.infer<typeof step4Schema>;

interface Step4FacilitiesProps {
  onDataChange: (data: Step4Data) => void;
  initialData?: Partial<Step4Data>;
}

export function Step4Facilities({ onDataChange, initialData }: Step4FacilitiesProps) {
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    initialData?.facilities?.map((f: any) => f.id) || []
  );

  const form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      facilities: initialData?.facilities || [],
    },
    mode: "onChange",
  });

  // Update parent when facilities change
  useEffect(() => {
    const facilities = ROOM_FACILITIES.filter(f => selectedFacilities.includes(f.id));
    onDataChange({ facilities });
  }, [selectedFacilities, onDataChange]);

  const handleFacilityToggle = (facilityId: string, checked: boolean) => {
    setSelectedFacilities(prev => {
      if (checked) {
        return [...prev, facilityId];
      } else {
        return prev.filter(id => id !== facilityId);
      }
    });

    const newFacilities = ROOM_FACILITIES.filter(f =>
      checked
        ? [...selectedFacilities, facilityId].includes(f.id)
        : selectedFacilities.filter(id => id !== facilityId).includes(f.id)
    );

    form.setValue("facilities", newFacilities, { shouldValidate: true });
  };

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
        {/* Room Facilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Fasilitas Kamar
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
              Fasilitas Kamar Mandi
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
      </div>
    </Form>
  );
}

