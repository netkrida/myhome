"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/ui/animated-card";
import {
  Calendar,
  Home,
  MapPin,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Booking {
  id: string;
  bookingCode: string;
  checkInDate?: string | Date | null;
  checkOutDate?: string | Date | null;
  leaseType?: string;
  totalAmount: number;
  depositAmount?: number;
  paymentStatus?: string;
  status: string;
  createdAt?: string | Date;
  propertyName?: string | null;
  roomType?: string | null;
  roomNumber?: string;
}

interface BookingListClientProps {
  bookings: Booking[];
}

export function BookingListClient({ bookings }: BookingListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      UNPAID: { label: "Belum Dibayar", variant: "destructive", icon: XCircle },
      DEPOSIT_PAID: { label: "DP Dibayar", variant: "secondary", icon: Clock },
      CONFIRMED: { label: "Terkonfirmasi", variant: "default", icon: CheckCircle2 },
      CHECKED_IN: { label: "Check-in", variant: "default", icon: CheckCircle2 },
      CHECKED_OUT: { label: "Check-out", variant: "secondary", icon: CheckCircle2 },
      COMPLETED: { label: "Selesai", variant: "outline", icon: CheckCircle2 },
      CANCELLED: { label: "Dibatalkan", variant: "destructive", icon: XCircle },
      EXPIRED: { label: "Kadaluarsa", variant: "destructive", icon: AlertCircle },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateValue?: string | Date | null) => {
    if (!dateValue) return "-";
    try {
      const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
      return format(date, "dd MMM yyyy", { locale: localeId });
    } catch {
      return "-";
    }
  };

  const filteredBookings = bookings
    .filter((booking) => {
      const matchesSearch =
        booking.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "createdAt") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === "checkInDate") {
        const dateA = a.checkInDate ? new Date(a.checkInDate).getTime() : 0;
        const dateB = b.checkInDate ? new Date(b.checkInDate).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Riwayat Booking
            </h1>
            <p className="text-muted-foreground">
              Kelola dan lihat semua booking properti Anda
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {filteredBookings.length} Booking
            </Badge>
          </div>
        </div>
      </AnimatedCard>

      {/* Filters */}
      <AnimatedCard delay={0.1}>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari booking code, properti, kamar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="UNPAID">Belum Dibayar</SelectItem>
                  <SelectItem value="DEPOSIT_PAID">DP Dibayar</SelectItem>
                  <SelectItem value="CONFIRMED">Terkonfirmasi</SelectItem>
                  <SelectItem value="CHECKED_IN">Check-in</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Terbaru</SelectItem>
                  <SelectItem value="checkInDate">Tanggal Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>

      {/* Booking List */}
      {filteredBookings.length === 0 ? (
        <AnimatedCard delay={0.2}>
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Belum Ada Booking</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Tidak ada booking yang sesuai dengan filter"
                  : "Anda belum memiliki booking. Mulai cari properti sekarang!"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => router.push("/")} size="lg">
                  Cari Properti
                </Button>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      ) : (
        <AnimatedList className="grid gap-4">
          {filteredBookings.map((booking) => (
            <AnimatedListItem key={booking.id}>
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left Section */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Booking Code</p>
                          <p className="font-mono font-bold text-lg group-hover:text-primary transition-colors">
                            {booking.bookingCode}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Home className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Properti</p>
                            <p className="font-semibold truncate">{booking.propertyName || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Kamar</p>
                            <p className="font-semibold truncate">
                              {booking.roomNumber || "-"} - {booking.roomType || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(booking.checkInDate)}</span>
                        </div>
                        {booking.checkOutDate && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatDate(booking.checkOutDate)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col items-end gap-4 lg:min-w-[200px]">
                      <div className="text-right w-full">
                        <p className="text-xs text-muted-foreground mb-1">Total Pembayaran</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                          {formatCurrency(booking.totalAmount)}
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push(`/dashboard/customer/booking/${booking.id}`)}
                        className="w-full group-hover:shadow-lg transition-shadow"
                        size="lg"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedListItem>
          ))}
        </AnimatedList>
      )}
    </div>
  );
}

