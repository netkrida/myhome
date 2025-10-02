"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
}

interface RoomCardProps {
  room: RoomAvailabilityInfo;
  propertyName: string;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function RoomCard({ room, propertyName }: RoomCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const getRoomStatusColor = () => {
    // Prioritas: Jika terisi (occupied) = MERAH
    if (room.isOccupied) {
      return "bg-red-500 hover:bg-red-600 border-red-600 text-white";
    }
    // Jika tersedia (available dan tidak occupied) = HIJAU
    if (room.isAvailable && !room.isOccupied) {
      return "bg-green-500 hover:bg-green-600 border-green-600 text-white";
    }
    // Jika tidak tersedia = ABU-ABU
    return "bg-gray-400 hover:bg-gray-500 border-gray-500 text-white";
  };

  const getRoomStatusText = () => {
    if (room.isOccupied) {
      return "Terisi";
    }
    if (room.isAvailable) {
      return "Tersedia";
    }
    return "Tidak Tersedia";
  };

  const getRoomStatusIcon = () => {
    if (room.isOccupied) {
      return <XCircle className="h-4 w-4" />;
    }
    if (room.isAvailable) {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <Info className="h-4 w-4" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={`
                  aspect-square w-full p-2 font-semibold
                  transition-all duration-200 hover:scale-105 relative
                  ${getRoomStatusColor()}
                `}
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  {/* Status Icon di pojok kanan atas */}
                  <div className="absolute top-1 right-1">
                    {room.isOccupied ? (
                      <XCircle className="h-3 w-3 text-white" />
                    ) : room.isAvailable ? (
                      <CheckCircle className="h-3 w-3 text-white" />
                    ) : (
                      <Info className="h-3 w-3 text-white" />
                    )}
                  </div>

                  {/* Icon kamar */}
                  <BedDouble className="h-4 w-4" />

                  {/* Nomor kamar */}
                  <span className="text-xs font-bold">{room.roomNumber}</span>

                  {/* Lantai */}
                  <span className="text-xs">Lt.{room.floor}</span>

                  {/* Status text */}
                  <div className="text-xs font-medium">
                    {room.isOccupied ? "TERISI" : room.isAvailable ? "TERSEDIA" : "TUTUP"}
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
                {/* Room Image */}
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

                {/* Room Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Lantai {room.floor}
                      </span>
                    </div>
                    <Badge 
                      className={`
                        text-white font-semibold
                        ${room.isOccupied ? 'bg-red-600' : 
                          room.isAvailable ? 'bg-green-600' : 'bg-gray-500'}
                      `}
                    >
                      {getRoomStatusIcon()}
                      <span className="ml-1">{getRoomStatusText()}</span>
                    </Badge>
                  </div>

                  {/* Booking Information */}
                  {room.isOccupied && room.currentBooking && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Informasi Penghuni
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-red-700">
                        <div>
                          <span className="font-medium">Nama:</span> {room.currentBooking.customerName}
                        </div>
                        <div>
                          <span className="font-medium">Kode Booking:</span> {room.currentBooking.bookingCode}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="font-medium">Check-in:</span> 
                          {formatDate(room.currentBooking.checkInDate)}
                        </div>
                        {room.currentBooking.checkOutDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="font-medium">Check-out:</span> 
                            {formatDate(room.currentBooking.checkOutDate)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Status:</span> 
                          <Badge variant="outline" className="ml-1 text-xs">
                            {room.currentBooking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Available Room Info */}
                  {room.isAvailable && !room.isOccupied && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Kamar Tersedia
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        Kamar ini tersedia untuk disewa. Silakan hubungi pengelola untuk informasi lebih lanjut.
                      </p>
                    </div>
                  )}

                  {/* Unavailable Room Info */}
                  {!room.isAvailable && !room.isOccupied && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">
                          Kamar Tidak Tersedia
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Kamar ini sedang tidak tersedia untuk disewa saat ini.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-2 border-t">
                  {room.isAvailable && !room.isOccupied ? (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Pesan Kamar Ini
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Tutup
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        
        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">Kamar {room.roomNumber}</div>
            <div className="text-xs text-muted-foreground">Lantai {room.floor}</div>
            <div className="text-xs font-medium">
              {getRoomStatusText()}
            </div>
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

export function RoomMapping({ roomType, propertyName }: RoomMappingProps) {
  const { rooms, totalRooms, availableRooms, occupiedRooms } = roomType;

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc, room) => {
    const floorKey = typeof room.floor === "number" ? room.floor : 0;
    const roomsOnFloor = acc[floorKey] ?? (acc[floorKey] = []);
    roomsOnFloor.push(room);
    return acc;
  }, {} as Record<number, RoomAvailabilityInfo[]>);

  // Sort floors
  const sortedFloors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Peta Kamar - {roomType.roomType}</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded border"></div>
              <span>Tersedia ({availableRooms})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded border"></div>
              <span>Terisi ({occupiedRooms})</span>
            </div>
            {totalRooms - availableRooms - occupiedRooms > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded border"></div>
                <span>Tidak Tersedia ({totalRooms - availableRooms - occupiedRooms})</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada kamar yang ditampilkan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedFloors.map((floor) => {
              const roomsForFloor = roomsByFloor[floor] ?? [];

              return (
                <div key={floor} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lantai {floor}
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                    {roomsForFloor
                      .slice()
                      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
                      .map((room) => (
                        <RoomCard 
                          key={room.id} 
                          room={room} 
                          propertyName={propertyName}
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
