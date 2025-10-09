"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  SummaryCards,
  PropertySlider,
  RoomsGrid,
  BookingDetailModal,
  RoomDetailModal,
  RoomEditModal,
  AddRoomModal,
} from "@/components/dashboard/adminkos/rooms-v2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PropertyCardData {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
  mainImageUrl: string | null;
}

interface RoomGridItem {
  id: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  hasActiveBooking: boolean;
  mainImageUrl: string | null;
  status: "available" | "occupied" | "unavailable";
}

interface RoomsSummary {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  propertyName?: string;
}

export default function RoomsPageV2() {
  // State
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [summary, setSummary] = useState<RoomsSummary>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
  });
  const [rooms, setRooms] = useState<RoomGridItem[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Modal states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<RoomGridItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Fetch properties
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch summary when property selection changes
  useEffect(() => {
    fetchSummary();
  }, [selectedPropertyId]);

  // Fetch rooms when property selection changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms();
    } else {
      setRooms([]);
      setIsLoadingRooms(false);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    setIsLoadingProperties(true);
    try {
      const response = await fetch("/api/adminkos/properties");
      const result = await response.json();

      if (result.success && result.data.properties) {
        const propertiesData = result.data.properties.map((p: any) => ({
          id: p.id,
          name: p.name,
          totalRooms: p.totalRooms,
          availableRooms: p.availableRooms,
          occupancyRate: p.occupancyRate,
          mainImageUrl: p.mainImageUrl,
        }));
        setProperties(propertiesData);

        // Auto-select first property if available
        if (propertiesData.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(propertiesData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Gagal memuat data properti");
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const url = selectedPropertyId
        ? `/api/adminkos/rooms/summary?propertyId=${selectedPropertyId}`
        : "/api/adminkos/rooms/summary";

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Gagal memuat ringkasan kamar");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchRooms = async () => {
    if (!selectedPropertyId) return;

    setIsLoadingRooms(true);
    try {
      const response = await fetch(`/api/adminkos/rooms/grid?propertyId=${selectedPropertyId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Gagal memuat data kamar");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handlePropertySelect = (propertyId: string | null) => {
    setSelectedPropertyId(propertyId);
  };

  const handleRoomClick = (room: RoomGridItem) => {
    if (room.hasActiveBooking) {
      setSelectedRoomForBooking(room.id);
      setBookingModalOpen(true);
    }
  };

  const handleRoomEdit = (room: RoomGridItem) => {
    setSelectedRoomForEdit(room);
    setEditModalOpen(true);
  };

  const handleViewBooking = (room: RoomGridItem) => {
    setSelectedRoomForBooking(room.id);
    setBookingModalOpen(true);
  };

  const handleViewDetail = (room: RoomGridItem) => {
    setSelectedRoomId(room.id);
    setDetailModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchSummary();
    fetchRooms();
  };

  const handleAddSuccess = () => {
    fetchProperties();
    fetchSummary();
    fetchRooms();
  };

  return (
    <DashboardLayout title="Manajemen Kamar">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kamar</h1>
            <p className="text-muted-foreground mt-1">
              Kelola kamar dan lihat status hunian
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Tambah Kamar
          </Button>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          totalRooms={summary.totalRooms}
          availableRooms={summary.availableRooms}
          occupiedRooms={summary.occupiedRooms}
          occupancyRate={summary.occupancyRate}
          propertyName={summary.propertyName}
          isLoading={isLoadingSummary}
        />

        {/* Property Slider */}
        {properties.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Pilih Properti</h2>
            <PropertySlider
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onPropertySelect={handlePropertySelect}
              isLoading={isLoadingProperties}
            />
          </div>
        )}

        {/* Rooms Grid */}
        {selectedPropertyId ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Peta Kamar</h2>
              <p className="text-sm text-muted-foreground">
                {rooms.length} kamar
              </p>
            </div>
            <RoomsGrid
              rooms={rooms}
              isLoading={isLoadingRooms}
              onRoomClick={handleRoomClick}
              onRoomEdit={handleRoomEdit}
              onViewBooking={handleViewBooking}
              onViewDetail={handleViewDetail}
            />
          </div>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              {properties.length === 0 ? (
                <>
                  <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Properti</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                    Anda belum memiliki properti. Tambahkan properti terlebih dahulu untuk
                    mengelola kamar.
                  </p>
                  <Button variant="outline">Tambah Properti</Button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Pilih Properti</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Pilih properti dari slider di atas untuk melihat daftar kamar
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <BookingDetailModal
        roomId={selectedRoomForBooking || ""}
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedRoomForBooking(null);
        }}
      />

      <RoomDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRoomId(null);
        }}
        roomId={selectedRoomId || ""}
      />

      <RoomEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRoomForEdit(null);
        }}
        onSuccess={handleEditSuccess}
        room={selectedRoomForEdit}
      />

      <AddRoomModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        preselectedPropertyId={selectedPropertyId}
      />
    </DashboardLayout>
  );
}

