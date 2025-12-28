"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingFiltersComponent, type BookingFilters } from "@/components/dashboard/adminkos/bookings/booking-filters";
import { BookingsTable } from "@/components/dashboard/adminkos/bookings/bookings-table";
import { BookingDetailCard } from "@/components/dashboard/adminkos/bookings/booking-detail-card";
import { AddBookingDialog } from "@/components/dashboard/adminkos/bookings/add-booking-dialog";
import { RenewalDialog } from "@/components/dashboard/adminkos/bookings/renewal-dialog";
import { Plus, FileDown, Loader2 } from "lucide-react";
import type { BookingTableItemDTO } from "@/server/types/adminkos";
import { exportToCSV, formatCurrencyForCSV, formatDateForCSV, formatDateTimeForCSV } from "@/lib/export-csv";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BookingsPageClientProps {
  initialData: {
    bookings: BookingTableItemDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  properties: Array<{ id: string; name: string }>;
}

export function BookingsPageClient({ initialData, properties }: BookingsPageClientProps) {
  const [bookings, setBookings] = React.useState(initialData.bookings);
  const [pagination, setPagination] = React.useState(initialData.pagination);
  const [filters, setFilters] = React.useState<BookingFilters>({});
  const [selectedBookingDetail, setSelectedBookingDetail] = React.useState<any | null>(null);
  const [isDetailCardOpen, setIsDetailCardOpen] = React.useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Check-in/Check-out state
  const [checkInBooking, setCheckInBooking] = React.useState<BookingTableItemDTO | null>(null);
  const [checkOutBooking, setCheckOutBooking] = React.useState<BookingTableItemDTO | null>(null);
  const [isCheckingIn, setIsCheckingIn] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  // Renewal state
  const [renewalBooking, setRenewalBooking] = React.useState<BookingTableItemDTO | null>(null);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = React.useState(false);

  // Fetch bookings with filters
  const fetchBookings = React.useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
      if (filters.leaseType) params.append("leaseType", filters.leaseType);
      if (filters.propertyId) params.append("propertyId", filters.propertyId);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      if (filters.overdue) params.append("overdue", "true");

      const response = await fetch(`/api/adminkos/bookings?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.data.bookings);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Refetch when filters change
  React.useEffect(() => {
    fetchBookings(1);
  }, [filters, fetchBookings]);

  const handlePageChange = (page: number) => {
    fetchBookings(page);
  };

  const handleViewDetails = async (booking: BookingTableItemDTO) => {
    setIsLoadingDetail(true);
    setIsDetailCardOpen(true);

    try {
      const response = await fetch(`/api/adminkos/bookings/${booking.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedBookingDetail(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch booking details");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      alert(error instanceof Error ? error.message : "Gagal memuat detail booking");
      setIsDetailCardOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailCardOpen(false);
    setSelectedBookingDetail(null);
  };

  // Handle Check-in
  const handleCheckIn = (booking: BookingTableItemDTO) => {
    setCheckInBooking(booking);
  };

  const confirmCheckIn = async () => {
    if (!checkInBooking) return;
    
    setIsCheckingIn(true);
    try {
      const response = await fetch("/api/adminkos/bookings/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: checkInBooking.id }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Gagal melakukan check-in");
      }
      
      alert(`Berhasil! Booking ${checkInBooking.bookingCode} sudah check-in`);
      fetchBookings(pagination.page);
    } catch (error) {
      console.error("Error checking in:", error);
      alert(error instanceof Error ? error.message : "Gagal melakukan check-in");
    } finally {
      setIsCheckingIn(false);
      setCheckInBooking(null);
    }
  };

  // Handle Check-out
  const handleCheckOut = (booking: BookingTableItemDTO) => {
    setCheckOutBooking(booking);
  };

  const confirmCheckOut = async () => {
    if (!checkOutBooking) return;
    
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/adminkos/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: checkOutBooking.id }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Gagal melakukan check-out");
      }
      
      alert(`Berhasil! Booking ${checkOutBooking.bookingCode} sudah check-out`);
      fetchBookings(pagination.page);
    } catch (error) {
      console.error("Error checking out:", error);
      alert(error instanceof Error ? error.message : "Gagal melakukan check-out");
    } finally {
      setIsCheckingOut(false);
      setCheckOutBooking(null);
    }
  };

  // Handle Renewal
  const handleRenewal = (booking: BookingTableItemDTO) => {
    setRenewalBooking(booking);
    setIsRenewalDialogOpen(true);
  };

  const handleRenewalSuccess = () => {
    fetchBookings(pagination.page);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all bookings without pagination for export
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Get max bookings
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
      if (filters.leaseType) params.append("leaseType", filters.leaseType);
      if (filters.propertyId) params.append("propertyId", filters.propertyId);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      if (filters.overdue) params.append("overdue", "true");

      const response = await fetch(`/api/adminkos/bookings?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Export error:", errorData);
        throw new Error(errorData.error || "Gagal mengambil data");
      }

      const data = await response.json();

      console.log("Export data:", data);

      if (!data.success) {
        throw new Error(data.error || "Gagal mengambil data");
      }

      if (!data.data || !data.data.bookings || data.data.bookings.length === 0) {
        alert("Tidak ada data untuk diekspor");
        return;
      }

      // Export data
      const leaseTypeLabels: Record<string, string> = {
          DAILY: "Harian",
          WEEKLY: "Mingguan",
          MONTHLY: "Bulanan",
          QUARTERLY: "3 Bulan",
          YEARLY: "Tahunan",
        };

        const bookingStatusLabels: Record<string, string> = {
          UNPAID: "Belum Bayar",
          DEPOSIT_PAID: "DP Dibayar",
          CONFIRMED: "Terkonfirmasi",
          CHECKED_IN: "Check-in",
          COMPLETED: "Selesai",
          CANCELLED: "Dibatalkan",
          EXPIRED: "Kadaluarsa",
        };

        const paymentStatusLabels: Record<string, string> = {
          PENDING: "Menunggu",
          SUCCESS: "Berhasil",
          FAILED: "Gagal",
          EXPIRED: "Kadaluarsa",
          REFUNDED: "Dikembalikan",
        };

        exportToCSV(
          data.data.bookings,
          `bookings-${new Date().toISOString().split("T")[0]}.csv`,
          [
            { key: "bookingCode", label: "Kode Booking" },
            { key: "customerName", label: "Nama Penyewa" },
            { key: "customerEmail", label: "Email Penyewa" },
            { key: "propertyName", label: "Properti" },
            { key: "roomNumber", label: "Nomor Kamar" },
            { key: "roomType", label: "Tipe Kamar" },
            {
              key: "checkInDate",
              label: "Check-in",
              format: formatDateForCSV
            },
            {
              key: "checkOutDate",
              label: "Check-out",
              format: formatDateForCSV
            },
            {
              key: "leaseType",
              label: "Tipe Sewa",
              format: (value) => leaseTypeLabels[value] || value
            },
            {
              key: "totalAmount",
              label: "Total (Rp)",
              format: formatCurrencyForCSV
            },
            {
              key: "depositAmount",
              label: "Deposit (Rp)",
              format: (value) => value ? formatCurrencyForCSV(value) : "0"
            },
            {
              key: "paymentStatus",
              label: "Status Pembayaran",
              format: (value) => paymentStatusLabels[value] || value
            },
            {
              key: "status",
              label: "Status Booking",
              format: (value) => bookingStatusLabels[value] || value
            },
            {
              key: "createdAt",
              label: "Tanggal Dibuat",
              format: formatDateTimeForCSV
            },
          ]
        );
    } catch (error) {
      console.error("Error exporting bookings:", error);
      alert(error instanceof Error ? error.message : "Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddSuccess = () => {
    // Refresh bookings list
    fetchBookings(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daftar Penyewa / Bookings</h1>
          <p className="text-muted-foreground">
            Kelola dan pantau semua booking dari properti Anda
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Booking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
          <CardDescription>
            Gunakan filter untuk menemukan booking yang Anda cari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            properties={properties}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Master Bookings</CardTitle>
          <CardDescription>
            Total {pagination.total} booking ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BookingsTable
              bookings={bookings}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewDetails={handleViewDetails}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onRenewal={handleRenewal}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Card (Centered Modal) */}
      {isDetailCardOpen && selectedBookingDetail && (
        <BookingDetailCard
          booking={selectedBookingDetail}
          onClose={handleCloseDetail}
        />
      )}

      {/* Loading Detail Overlay */}
      {isDetailCardOpen && isLoadingDetail && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Memuat detail booking...</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Dialog */}
      <AddBookingDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
        properties={properties}
      />

      {/* Renewal Dialog */}
      <RenewalDialog
        open={isRenewalDialogOpen}
        onOpenChange={setIsRenewalDialogOpen}
        onSuccess={handleRenewalSuccess}
        booking={renewalBooking}
      />

      {/* Check-in Confirmation Dialog */}
      <AlertDialog open={!!checkInBooking} onOpenChange={() => setCheckInBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Check-in</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin melakukan check-in untuk booking{" "}
              <span className="font-semibold">{checkInBooking?.bookingCode}</span> atas nama{" "}
              <span className="font-semibold">{checkInBooking?.customerName}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCheckingIn}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckIn} disabled={isCheckingIn}>
              {isCheckingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Check-in"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Check-out Confirmation Dialog */}
      <AlertDialog open={!!checkOutBooking} onOpenChange={() => setCheckOutBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Check-out</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin melakukan check-out untuk booking{" "}
              <span className="font-semibold">{checkOutBooking?.bookingCode}</span> atas nama{" "}
              <span className="font-semibold">{checkOutBooking?.customerName}</span>?
              <br />
              <span className="text-orange-600 mt-2 block">
                Kamar akan tersedia kembali setelah check-out.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCheckingOut}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckOut} disabled={isCheckingOut}>
              {isCheckingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Check-out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

