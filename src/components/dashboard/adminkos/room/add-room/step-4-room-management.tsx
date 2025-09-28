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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building, 
  CheckCircle2,
  XCircle,
  Hash,
  Layers,
  Bed,
  Plus,
  Trash2
} from "lucide-react";
import { FormPersistence } from "@/lib/form-persistence";
import { toast } from "sonner";
import { createRoomStep4Schema } from "@/server/schemas/room.schemas";
import { useMultiStepForm } from "@/components/ui/multi-step-form";

// Create a form-specific schema with required isAvailable
const formSchema = z.object({
  rooms: z.array(z.object({
    roomNumber: z.string().min(1, "Room number is required").max(50, "Room number must be less than 50 characters"),
    floor: z.number().min(1, "Floor must be at least 1").max(50, "Floor cannot exceed 50"),
    roomType: z.string().min(1, "Room type is required"),
    isAvailable: z.boolean(),
  })).min(1, "At least one room configuration is required"),
});

type Step4FormData = z.infer<typeof formSchema>;

interface Step4RoomManagementProps {
  onDataChange: (data: z.infer<typeof createRoomStep4Schema>) => void;
  initialData?: Partial<z.infer<typeof createRoomStep4Schema>>;
  roomTypes: string[];
  totalRooms: number;
}

interface RoomItem {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  isAvailable: boolean;
}

export function Step4RoomManagement({
  onDataChange,
  initialData,
  roomTypes,
  totalRooms
}: Step4RoomManagementProps) {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const { setStepValid } = useMultiStepForm();

  // Use refs to prevent infinite loops
  const previousDataRef = useRef<string>("");
  const previousValidityRef = useRef<boolean>(false);

  const form = useForm<Step4FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rooms: initialData?.rooms?.map(room => ({
        ...room,
        isAvailable: room.isAvailable ?? true
      })) || [],
    },
  });

  const watchedData = form.watch();

  // Initialize rooms based on totalRooms
  useEffect(() => {
    if (rooms.length === 0 && totalRooms > 0) {
      const initialRooms: RoomItem[] = [];
      for (let i = 1; i <= totalRooms; i++) {
        initialRooms.push({
          id: `room-${i}`,
          roomNumber: i.toString(),
          floor: Math.ceil(i / 10), // Default: 10 rooms per floor
          roomType: roomTypes[0] || "",
          isAvailable: true,
        });
      }
      setRooms(initialRooms);
      form.setValue("rooms", initialRooms.map(room => ({
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        isAvailable: room.isAvailable,
      })), { shouldValidate: true });
    }
  }, [totalRooms, roomTypes, rooms.length, form]);

  // Handle form validation and data changes with refs to prevent infinite loops
  useEffect(() => {
    const isValid = form.formState.isValid && rooms.length === totalRooms;
    const formData = {
      rooms: rooms.map(room => ({
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        isAvailable: room.isAvailable,
      }))
    };
    const currentDataString = JSON.stringify(formData);

    // Only update step validity if it has changed
    if (previousValidityRef.current !== isValid) {
      setStepValid(3, isValid);
      previousValidityRef.current = isValid;
    }

    // Only call onDataChange and persist if data has actually changed
    if (previousDataRef.current !== currentDataString) {
      onDataChange(formData);
      previousDataRef.current = currentDataString;

      // Only persist when valid
      if (isValid) {
        FormPersistence.saveFormData(formData, {
          key: "room-creation-step-4",
          useSessionStorage: true,
        });
      }
    }
  });

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = FormPersistence.loadFormData<Step4FormData>({
      key: "room-creation-step-4",
      useSessionStorage: true,
    });

    if (persistedData?.data && !initialData && persistedData.data.rooms.length > 0) {
      const loadedRooms = persistedData.data.rooms.map((room, index) => ({
        id: `room-${index + 1}`,
        ...room,
      }));
      setRooms(loadedRooms);
      form.reset(persistedData.data);
    }
  }, [form, initialData]);

  // Initial validation check
  useEffect(() => {
    const isValid = form.formState.isValid && rooms.length === totalRooms;
    setStepValid(3, isValid);
  }, [form.formState.isValid, rooms.length, totalRooms, setStepValid]);

  // Send initial data on mount (runs once)
  useEffect(() => {
    const formData = {
      rooms: rooms.map(room => ({
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        isAvailable: room.isAvailable,
      }))
    };
    onDataChange(formData);
  }, []); // Empty deps to run only once on mount

  // Update room data
  const updateRoom = (roomId: string, updates: Partial<RoomItem>) => {
    const updatedRooms = rooms.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    );
    setRooms(updatedRooms);
    
    // Update form data
    form.setValue("rooms", updatedRooms.map(room => ({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      isAvailable: room.isAvailable,
    })), { shouldValidate: true });
  };

  // Add new room
  const addRoom = () => {
    if (rooms.length >= totalRooms) {
      toast.error(`Maksimal ${totalRooms} kamar sesuai data properti`);
      return;
    }

    const newRoom: RoomItem = {
      id: `room-${Date.now()}`,
      roomNumber: (rooms.length + 1).toString(),
      floor: 1,
      roomType: roomTypes[0] || "",
      isAvailable: true,
    };

    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    
    form.setValue("rooms", updatedRooms.map(room => ({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      isAvailable: room.isAvailable,
    })), { shouldValidate: true });
  };

  // Remove room
  const removeRoom = (roomId: string) => {
    const updatedRooms = rooms.filter(room => room.id !== roomId);
    setRooms(updatedRooms);
    
    form.setValue("rooms", updatedRooms.map(room => ({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      isAvailable: room.isAvailable,
    })), { shouldValidate: true });
  };

  // Filter rooms based on active tab
  const filteredRooms = rooms.filter(room => {
    switch (activeTab) {
      case "available":
        return room.isAvailable;
      case "unavailable":
        return !room.isAvailable;
      default:
        return true;
    }
  });

  // Count rooms by status
  const availableCount = rooms.filter(room => room.isAvailable).length;
  const unavailableCount = rooms.filter(room => !room.isAvailable).length;

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Pengaturan Kamar</h2>
          <p className="text-muted-foreground mt-2">
            Atur detail setiap kamar dan status ketersediaannya
          </p>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{totalRooms}</p>
                <p className="text-sm text-muted-foreground">Total Kamar</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{rooms.length}</p>
                <p className="text-sm text-muted-foreground">Kamar Diatur</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{availableCount}</p>
                <p className="text-sm text-muted-foreground">Tersedia</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{unavailableCount}</p>
                <p className="text-sm text-muted-foreground">Tidak Tersedia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Daftar Kamar
            </CardTitle>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Kelola detail setiap kamar di properti Anda
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRoom}
                disabled={rooms.length >= totalRooms}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kamar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  Semua Kamar ({rooms.length})
                </TabsTrigger>
                <TabsTrigger value="available">
                  Tersedia ({availableCount})
                </TabsTrigger>
                <TabsTrigger value="unavailable">
                  Tidak Tersedia ({unavailableCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {filteredRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {activeTab === "all" 
                        ? "Belum ada kamar yang diatur"
                        : activeTab === "available"
                        ? "Tidak ada kamar yang tersedia"
                        : "Tidak ada kamar yang tidak tersedia"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map((room) => (
                      <Card key={room.id} className={`${
                        room.isAvailable 
                          ? 'border-green-200 bg-green-50/50' 
                          : 'border-red-200 bg-red-50/50'
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              Kamar {room.roomNumber}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {room.isAvailable ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Tersedia
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Tidak Tersedia
                                </Badge>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRoom(room.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Room Number */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Nomor Kamar</Label>
                            <Input
                              value={room.roomNumber}
                              onChange={(e) => updateRoom(room.id, { roomNumber: e.target.value })}
                              placeholder="Nomor kamar"
                            />
                          </div>

                          {/* Floor */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Lantai</Label>
                            <div className="relative">
                              <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min="1"
                                value={room.floor}
                                onChange={(e) => updateRoom(room.id, { floor: Number(e.target.value) })}
                                className="pl-10"
                                placeholder="Lantai"
                              />
                            </div>
                          </div>

                          {/* Room Type */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Jenis Kamar</Label>
                            <Select
                              value={room.roomType}
                              onValueChange={(value) => updateRoom(room.id, { roomType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis kamar" />
                              </SelectTrigger>
                              <SelectContent>
                                {roomTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Availability */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={room.isAvailable}
                              onCheckedChange={(checked) => 
                                updateRoom(room.id, { isAvailable: checked as boolean })
                              }
                            />
                            <Label className="text-sm">
                              Kamar tersedia untuk disewa
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {rooms.length < totalRooms && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-orange-600">
                  Anda perlu mengatur {totalRooms - rooms.length} kamar lagi untuk melengkapi data properti
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Field for Validation */}
        <FormField
          control={form.control}
          name="rooms"
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
