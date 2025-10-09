"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  MapPin,
  Layers,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  Loader2,
  ImageIcon,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

interface RoomDetail {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  description: string | null;
  size: string | null;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  facilities: any;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
    fullAddress: string;
  };
  images: {
    id: string;
    imageUrl: string;
    category: string;
  }[];
  activeBooking: {
    id: string;
    bookingCode: string;
    status: string;
    paymentStatus: string;
    leaseType: string;
    checkInDate: string;
    checkOutDate: string | null;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    user: {
      id: string;
      name: string;
      email: string;
      phoneNumber: string | null;
    };
  } | null;
}

export function RoomDetailModal({ isOpen, onClose, roomId }: RoomDetailModalProps) {
  const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRoomDetail();
    }
  }, [isOpen, roomId]);

  const fetchRoomDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/adminkos/rooms/${roomId}/detail`);
      const result = await response.json();

      if (result.success && result.data) {
        setRoomDetail(result.data);
      } else {
        setError(result.error || "Failed to load room detail");
      }
    } catch (err) {
      console.error("Error fetching room detail:", err);
      setError("Failed to load room detail");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      available: { label: "Tersedia", variant: "default" },
      occupied: { label: "Terisi", variant: "secondary" },
      unavailable: { label: "Nonaktif", variant: "outline" },
    };

    const statusKey = roomDetail?.isAvailable ? (roomDetail.activeBooking ? "occupied" : "available") : "unavailable";
    const config = statusConfig[statusKey];
    if (!config) return null;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getBookingStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Menunggu", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
      CONFIRMED: { label: "Dikonfirmasi", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
      CHECKED_IN: { label: "Check-in", className: "bg-green-500/10 text-green-700 border-green-500/20" },
      CHECKED_OUT: { label: "Check-out", className: "bg-gray-500/10 text-gray-700 border-gray-500/20" },
      CANCELLED: { label: "Dibatalkan", className: "bg-red-500/10 text-red-700 border-red-500/20" },
    };

    const config = statusConfig[status] || statusConfig["PENDING"];
    if (!config) return null;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Belum Bayar", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
      PARTIAL: { label: "Sebagian", className: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
      PAID: { label: "Lunas", className: "bg-green-500/10 text-green-700 border-green-500/20" },
      REFUNDED: { label: "Dikembalikan", className: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
    };

    const config = statusConfig[status] || statusConfig["PENDING"];
    if (!config) return null;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detail Kamar
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : roomDetail ? (
            <div className="space-y-6">
              {/* Room Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Kamar #{roomDetail.roomNumber}</h3>
                    <p className="text-muted-foreground">{roomDetail.roomType}</p>
                  </div>
                  {getStatusBadge(roomDetail.isAvailable ? "available" : "unavailable")}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Properti:</span>
                    <span className="font-medium">{roomDetail.property.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Lantai:</span>
                    <span className="font-medium">{roomDetail.floor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Alamat:</span>
                    <span className="font-medium">{roomDetail.property.fullAddress}</span>
                  </div>
                </div>

                {roomDetail.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Deskripsi:</p>
                    <p className="text-sm">{roomDetail.description}</p>
                  </div>
                )}

                {roomDetail.size && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Ukuran:</span>
                    <span className="font-medium">{roomDetail.size}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Harga Sewa
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Bulanan</p>
                    <p className="font-semibold text-primary">{formatCurrency(roomDetail.monthlyPrice)}</p>
                  </div>
                  {roomDetail.dailyPrice && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Harian</p>
                      <p className="font-semibold">{formatCurrency(roomDetail.dailyPrice)}</p>
                    </div>
                  )}
                  {roomDetail.weeklyPrice && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Mingguan</p>
                      <p className="font-semibold">{formatCurrency(roomDetail.weeklyPrice)}</p>
                    </div>
                  )}
                  {roomDetail.quarterlyPrice && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">3 Bulan</p>
                      <p className="font-semibold">{formatCurrency(roomDetail.quarterlyPrice)}</p>
                    </div>
                  )}
                  {roomDetail.yearlyPrice && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Tahunan</p>
                      <p className="font-semibold">{formatCurrency(roomDetail.yearlyPrice)}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Active Booking */}
              {roomDetail.activeBooking ? (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Booking Aktif
                  </h4>
                  <div className="p-4 rounded-lg border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-medium">{roomDetail.activeBooking.bookingCode}</p>
                        <p className="text-xs text-muted-foreground">Kode Booking</p>
                      </div>
                      <div className="flex gap-2">
                        {getBookingStatusBadge(roomDetail.activeBooking.status)}
                        {getPaymentStatusBadge(roomDetail.activeBooking.paymentStatus)}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Informasi Penyewa:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{roomDetail.activeBooking.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{roomDetail.activeBooking.user.email}</span>
                        </div>
                        {roomDetail.activeBooking.user.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{roomDetail.activeBooking.user.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check-in</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(roomDetail.activeBooking.checkInDate), "dd MMM yyyy", { locale: localeId })}
                        </p>
                      </div>
                      {roomDetail.activeBooking.checkOutDate && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check-out</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(roomDetail.activeBooking.checkOutDate), "dd MMM yyyy", { locale: localeId })}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Tagihan</span>
                        <span className="font-semibold">{formatCurrency(roomDetail.activeBooking.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sudah Dibayar</span>
                        <span className="font-semibold text-green-600">{formatCurrency(roomDetail.activeBooking.paidAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Sisa Tagihan</span>
                        <span className="font-bold text-primary">{formatCurrency(roomDetail.activeBooking.remainingAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Tidak ada booking aktif</p>
                </div>
              )}
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

