"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LeaseType } from "@/server/types/booking";

interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  properties: Array<{ id: string; name: string }>;
}

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  monthlyPrice: number;
  isAvailable: boolean;
}

export function AddBookingDialog({
  open,
  onOpenChange,
  onSuccess,
  properties
}: AddBookingDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = React.useState(false);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  
  // Form state
  const [propertyId, setPropertyId] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [checkInDate, setCheckInDate] = React.useState<Date>();
  const [leaseType, setLeaseType] = React.useState<LeaseType>(LeaseType.MONTHLY);
  const [depositOption, setDepositOption] = React.useState<"deposit" | "full">("full");

  // Fetch rooms when property changes
  React.useEffect(() => {
    if (propertyId) {
      fetchRooms(propertyId);
    } else {
      setRooms([]);
      setRoomId("");
    }
  }, [propertyId]);

  const fetchRooms = async (propId: string) => {
    setIsLoadingRooms(true);
    try {
      const response = await fetch(`/api/adminkos/rooms?propertyId=${propId}&isAvailable=true&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setRooms(data.data.rooms);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      alert("Gagal memuat daftar kamar");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyId || !roomId || !customerEmail || !checkInDate) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      // First, check if customer exists or create new customer
      const customerResponse = await fetch("/api/adminkos/bookings/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerEmail,
          name: customerName,
          phoneNumber: customerPhone,
        }),
      });

      const customerData = await customerResponse.json();
      
      if (!customerData.success) {
        throw new Error(customerData.error || "Gagal membuat/mencari customer");
      }

      const customerId = customerData.data.userId;

      // Create booking
      const bookingResponse = await fetch("/api/adminkos/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customerId,
          roomId,
          checkInDate: checkInDate.toISOString(),
          leaseType,
          depositOption,
        }),
      });

      const bookingData = await bookingResponse.json();

      if (!bookingData.success) {
        throw new Error(bookingData.error || "Gagal membuat booking");
      }

      alert(`Berhasil! Booking ${bookingData.data.bookingCode} berhasil dibuat`);

      // Reset form
      resetForm();
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error("Error creating booking:", error);
      alert(error instanceof Error ? error.message : "Gagal membuat booking");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPropertyId("");
    setRoomId("");
    setCustomerEmail("");
    setCustomerName("");
    setCustomerPhone("");
    setCheckInDate(undefined);
    setLeaseType(LeaseType.MONTHLY);
    setDepositOption("full");
    setRooms([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Booking Manual</DialogTitle>
          <DialogDescription>
            Buat booking baru untuk customer. Pastikan semua data sudah benar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">Properti *</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="property">
                <SelectValue placeholder="Pilih properti" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="room">Kamar *</Label>
            <Select 
              value={roomId} 
              onValueChange={setRoomId}
              disabled={!propertyId || isLoadingRooms}
            >
              <SelectTrigger id="room">
                <SelectValue placeholder={
                  isLoadingRooms ? "Memuat kamar..." : 
                  !propertyId ? "Pilih properti terlebih dahulu" : 
                  "Pilih kamar"
                } />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.roomNumber} - {room.roomType} (Rp {room.monthlyPrice.toLocaleString("id-ID")}/bulan)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Info */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Informasi Penyewa</h4>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama lengkap penyewa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. HP</Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08123456789"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Detail Booking</h4>

            <div className="space-y-2">
              <Label>Tanggal Check-in *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkInDate ? format(checkInDate, "dd MMMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkInDate}
                    onSelect={setCheckInDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaseType">Tipe Sewa *</Label>
              <Select value={leaseType} onValueChange={(value) => setLeaseType(value as LeaseType)}>
                <SelectTrigger id="leaseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LeaseType.DAILY}>Harian</SelectItem>
                  <SelectItem value={LeaseType.WEEKLY}>Mingguan</SelectItem>
                  <SelectItem value={LeaseType.MONTHLY}>Bulanan</SelectItem>
                  <SelectItem value={LeaseType.QUARTERLY}>3 Bulan</SelectItem>
                  <SelectItem value={LeaseType.YEARLY}>Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositOption">Opsi Pembayaran *</Label>
              <Select value={depositOption} onValueChange={(value) => setDepositOption(value as "deposit" | "full")}>
                <SelectTrigger id="depositOption">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Bayar Penuh</SelectItem>
                  <SelectItem value="deposit">Bayar Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

