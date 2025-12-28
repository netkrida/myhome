"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Calendar as CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BookingStatus, PaymentStatus, LeaseType } from "@/server/types/booking";

export interface BookingFilters {
  search?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  leaseType?: LeaseType;
  propertyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface BookingFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  properties?: Array<{ id: string; name: string }>;
}

export function BookingFiltersComponent({ filters, onFiltersChange, properties = [] }: BookingFiltersProps) {
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(filters.dateFrom);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(filters.dateTo);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value === "all" ? undefined : (value as BookingStatus) 
    });
  };

  const handlePaymentStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      paymentStatus: value === "all" ? undefined : (value as PaymentStatus) 
    });
  };

  const handleLeaseTypeChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      leaseType: value === "all" ? undefined : (value as LeaseType) 
    });
  };

  const handlePropertyChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      propertyId: value === "all" ? undefined : value 
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFiltersChange({ ...filters, dateFrom: date });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFiltersChange({ ...filters, dateTo: date });
  };

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange({});
  };

  const hasActiveFilters = 
    filters.search || 
    filters.status || 
    filters.paymentStatus || 
    filters.leaseType || 
    filters.propertyId ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari booking code, nama penyewa, nomor kamar..."
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Reset Filter
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        {/* Booking Status Filter */}
        <Select 
          value={filters.status || "all"} 
          onValueChange={handleStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status Booking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="UNPAID">Belum Bayar</SelectItem>
            <SelectItem value="DEPOSIT_PAID">DP Dibayar</SelectItem>
            <SelectItem value="CONFIRMED">Terkonfirmasi</SelectItem>
            <SelectItem value="CHECKED_IN">Check-in</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Status Filter */}
        <Select 
          value={filters.paymentStatus || "all"} 
          onValueChange={handlePaymentStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status Pembayaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pembayaran</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="SUCCESS">Berhasil</SelectItem>
            <SelectItem value="FAILED">Gagal</SelectItem>
            <SelectItem value="REFUNDED">Dikembalikan</SelectItem>
          </SelectContent>
        </Select>

        {/* Lease Type Filter */}
        <Select 
          value={filters.leaseType || "all"} 
          onValueChange={handleLeaseTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipe Sewa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="DAILY">Harian</SelectItem>
            <SelectItem value="WEEKLY">Mingguan</SelectItem>
            <SelectItem value="MONTHLY">Bulanan</SelectItem>
            <SelectItem value="QUARTERLY">3 Bulan</SelectItem>
            <SelectItem value="YEARLY">Tahunan</SelectItem>
          </SelectContent>
        </Select>

        {/* Property Filter */}
        {properties.length > 1 && (
          <Select 
            value={filters.propertyId || "all"} 
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Properti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Properti</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Range Filter */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal flex-1",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd MMM", { locale: idLocale }) : "Dari"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={handleDateFromChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal flex-1",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd MMM", { locale: idLocale }) : "Sampai"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={handleDateToChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

