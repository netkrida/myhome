"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BedDouble,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import type { RoomTypeDetailDTO, RoomAvailabilityInfo } from "@/server/types/room";

interface RoomMappingProps {
  roomType: RoomTypeDetailDTO;
  propertyName: string;
  propertyId: string;
  onSelectRoom?: (room: RoomAvailabilityInfo) => void;
  selectedRoomId?: string;
  actionLabel?: string;
}

interface RoomCardProps {
  room: RoomAvailabilityInfo;
  propertyName: string;
  propertyId: string;
  roomTypeName: string;
  onSelectRoom?: (room: RoomAvailabilityInfo) => void;
  actionLabel?: string;
  isSelected?: boolean;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RoomCard({
  room,
  propertyName,
  propertyId,
  roomTypeName,
  onSelectRoom,
  actionLabel,
  isSelected = false,
}: RoomCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const isSelectable = Boolean(onSelectRoom) && room.isAvailable && !room.isOccupied;
  const canBook = room.isAvailable && !room.isOccupied;

  const getRoomStatusColor = () => {
    if (isSelected) {
      return "bg-blue-600 hover:bg-blue-600 border-blue-500 text-white shadow-lg";
    }
    if (room.isOccupied) {
      return "bg-red-500 hover:bg-red-600 border-red-600 text-white";
    }
    if (room.isAvailable && !room.isOccupied) {
      return "bg-green-500 hover:bg-green-600 border-green-600 text-white";
    }
    return "bg-gray-400 hover:bg-gray-500 border-gray-500 text-white";
  };

  const getRoomStatusText = () => {
    if (isSelected) {
      return "Dipilih";
    }
    if (room.isOccupied) {
      return "Terisi";
    }
    if (room.isAvailable) {
      return "Tersedia";
    }
    return "Tidak Tersedia";
  };

  const getRoomStatusIcon = () => {
    if (isSelected) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (room.isOccupied) {
      return <XCircle className="h-4 w-4" />;
    }
    if (room.isAvailable) {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <Info className="h-4 w-4" />;
  };

  const handleDefaultSelect = () => {
    const params = new URLSearchParams({
      roomType: roomTypeName,
      roomId: room.id,
    });
    setIsDialogOpen(false);
    router.push(`/booking/${propertyId}?${params.toString()}`);
  };

  const handleSelectRoom = () => {
    if (isSelectable && onSelectRoom) {
      onSelectRoom(room);
      setIsDialogOpen(false);
    } else if (canBook) {
      handleDefaultSelect();
    }
  };

  const actionButtonLabel = () => {
    if (isSelectable) {
      return isSelected ? "Kamar Dipilih" : actionLabel ?? "Pilih Kamar Ini";
    }
    return actionLabel ?? "Pesan Kamar Ini";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "aspect-square w-full p-2 font-semibold transition-all duration-200 hover:scale-105 relative",
                  getRoomStatusColor(),
                  isSelectable ? "cursor-pointer" : "cursor-default",
                  isSelected && "ring-2 ring-offset-2 ring-blue-300"
                )}
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="absolute top-1 right-1">
                    {getRoomStatusIcon()}
                  </div>
                  <BedDouble className="h-4 w-4" />
                  <span className="text-xs font-bold">{room.roomNumber}</span>
                  <span className="text-xs">Lt.{room.floor}</span>
                  <div className="text-[11px] font-semibold uppercase tracking-wide">
                    {isSelected ? "Dipilih" : room.isOccupied ? "Terisi" : room.isAvailable ? "Tersedia" : "Tutup"}
                  </div>
                </div>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5" />
                  Kamar {room.roomNumber} - {propertyName}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {room.mainImage && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
                    <Image
                      src={room.mainImage}
                      alt={`Kamar ${room.roomNumber}`}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Lantai {room.floor}</span>
                    </div>
                    <Badge
                      className={cn(
                        "px-2 py-1 text-xs font-semibold",
                        isSelected && "bg-blue-600 text-white",
                        !isSelected && canBook && "bg-green-500 text-white",
                        room.isOccupied && "bg-red-500 text-white",
                        !canBook && !room.isOccupied && "bg-gray-200 text-foreground"
                      )}
                    >
                      {getRoomStatusText()}
                    </Badge>
                  </div>

                  {room.currentBooking ? (
                    <div className="space-y-2 rounded-lg bg-muted/60 p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <User className="h-4 w-4" />
                        Informasi Penyewa Saat Ini
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Nama:</span> {room.currentBooking.customerName}
                        </div>
                        <div>
                          <span className="font-medium">Kode Booking:</span> {room.currentBooking.bookingCode}
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Check-in: {formatDate(room.currentBooking.checkInDate)}</span>
                          </div>
                          {room.currentBooking.checkOutDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Check-out: {formatDate(room.currentBooking.checkOutDate)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> {room.currentBooking.status}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border p-3 text-sm">
                        <div className="text-xs font-medium text-muted-foreground">Status</div>
                        <div className="text-base font-semibold text-foreground">
                          {room.isAvailable ? "Tersedia" : "Tidak Tersedia"}
                        </div>
                      </div>
                      <div className="rounded-md border p-3 text-sm">
                        <div className="text-xs font-medium text-muted-foreground">Nomor Kamar</div>
                        <div className="text-base font-semibold text-foreground">
                          {room.roomNumber}
                        </div>
                      </div>
                    </div>
                  )}

                  {canBook ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium text-emerald-700">
                        <CheckCircle className="h-4 w-4" />
                        Kamar tersedia untuk dipesan
                      </div>
                      <p className="mt-1 text-xs text-emerald-600">
                        Selesaikan detail pemesanan untuk mengamankan kamar ini.
                      </p>
                    </div>
                  ) : room.isOccupied ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium text-rose-700">
                        <XCircle className="h-4 w-4" />
                        Kamar sedang terisi
                      </div>
                      <p className="mt-1 text-xs text-rose-600">
                        Silakan pilih kamar lain atau cek kembali beberapa saat lagi.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <Info className="h-4 w-4" />
                        Kamar tidak tersedia
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Kamar ini belum dapat dipesan saat ini.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Tutup
                  </Button>
                  <Button
                    className={cn(
                      "bg-blue-600 text-white hover:bg-blue-700",
                      isSelectable && isSelected && "bg-blue-700 hover:bg-blue-700",
                      !canBook && "pointer-events-none opacity-60"
                    )}
                    disabled={!canBook}
                    onClick={handleSelectRoom}
                  >
                    {actionButtonLabel()}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>

        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">Kamar {room.roomNumber}</div>
            <div className="text-xs text-muted-foreground">Lantai {room.floor}</div>
            <div className="text-xs font-medium">{getRoomStatusText()}</div>
            {room.isOccupied && room.currentBooking && (
              <div className="text-xs text-muted-foreground">
                {room.currentBooking.customerName}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function RoomMapping({
  roomType,
  propertyName,
  propertyId,
  onSelectRoom,
  selectedRoomId,
  actionLabel,
}: RoomMappingProps) {
  const { rooms, totalRooms, availableRooms, occupiedRooms } = roomType;

  const roomsByFloor = rooms.reduce((acc, room) => {
    const floorKey = typeof room.floor === "number" ? room.floor : 0;
    const roomsOnFloor = acc[floorKey] ?? (acc[floorKey] = []);
    roomsOnFloor.push(room);
    return acc;
  }, {} as Record<number, RoomAvailabilityInfo[]>);

  const sortedFloors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => a - b);

  const selectedRoom = selectedRoomId
    ? rooms.find((room) => room.id === selectedRoomId)
    : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg">Peta Kamar - {roomType.roomType}</CardTitle>
            {selectedRoom && (
              <p className="mt-1 text-sm text-muted-foreground">
                Kamar dipilih: {selectedRoom.roomNumber} (Lt.{selectedRoom.floor})
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border bg-green-500" />
              <span>Tersedia ({availableRooms})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border bg-red-500" />
              <span>Terisi ({occupiedRooms})</span>
            </div>
            {totalRooms - availableRooms - occupiedRooms > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border bg-gray-400" />
                <span>Tidak Tersedia ({totalRooms - availableRooms - occupiedRooms})</span>
              </div>
            )}
            {selectedRoomId && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-blue-500 bg-blue-500/80" />
                <span>Dipilih</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {rooms.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <BedDouble className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>Tidak ada kamar yang ditampilkan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedFloors.map((floor) => {
              const roomsForFloor = roomsByFloor[floor] ?? [];

              return (
                <div key={floor} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MapPin className="h-4 w-4" />
                    Lantai {floor}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
                    {roomsForFloor
                      .slice()
                      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
                      .map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          propertyName={propertyName}
                          propertyId={propertyId}
                          roomTypeName={roomType.roomType}
                          onSelectRoom={onSelectRoom}
                          actionLabel={actionLabel}
                          isSelected={selectedRoomId === room.id}
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
