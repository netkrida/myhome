"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Download,
  RefreshCcw,
  Loader2,
  Calendar,
  Filter,
  Users,
  DoorOpen,
  DoorClosed,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import type { BookingReportItem, BookingReportResponse } from "@/server/types/report";

// Translate status to Indonesian
function translateStatus(status: string): string {
  switch (status) {
    case "UNPAID":
      return "Belum Bayar";
    case "DEPOSIT_PAID":
      return "DP Dibayar";
    case "CONFIRMED":
      return "Terkonfirmasi";
    case "CHECKED_IN":
      return "Sudah Check-in";
    case "COMPLETED":
      return "Selesai";
    case "CANCELLED":
      return "Dibatalkan";
    case "EXPIRED":
      return "Kadaluarsa";
    default:
      return status;
  }
}

// Translate lease type to Indonesian
function translateLeaseType(leaseType: string): string {
  switch (leaseType) {
    case "DAILY":
      return "Harian";
    case "WEEKLY":
      return "Mingguan";
    case "MONTHLY":
      return "Bulanan";
    case "QUARTERLY":
      return "3 Bulan";
    case "YEARLY":
      return "Tahunan";
    default:
      return leaseType;
  }
}

// Get status color
function getStatusColor(status: string): string {
  switch (status) {
    case "CHECKED_IN":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
    case "DEPOSIT_PAID":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ReceptionistReportsClient() {
  const [reports, setReports] = useState<BookingReportItem[]>([]);
  const [summary, setSummary] = useState<BookingReportResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>("");
  const [leaseType, setLeaseType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (status && status !== "ALL") params.set("status", status);
      if (leaseType && leaseType !== "ALL") params.set("leaseType", leaseType);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/receptionist/reports?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal memuat laporan");
      }

      setReports(data.data.reports);
      setSummary(data.data.summary);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, [status, leaseType, dateFrom, dateTo]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleExport = async () => {
    try {
      setExporting(true);

      const params = new URLSearchParams();
      if (status && status !== "ALL") params.set("status", status);
      if (leaseType && leaseType !== "ALL") params.set("leaseType", leaseType);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/receptionist/reports/export?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengekspor laporan");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "laporan_booking.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Laporan berhasil diunduh!");
    } catch (error) {
      console.error("Error exporting reports:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengekspor laporan");
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setStatus("");
    setLeaseType("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Booking</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in</CardTitle>
            <DoorOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{summary?.checkedIn || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checkout</CardTitle>
            <DoorClosed className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{summary?.checkedOut || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terkonfirmasi</CardTitle>
            <Clock className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600">{summary?.confirmed || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DP Dibayar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{summary?.depositPaid || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
          <CardDescription>Sesuaikan filter untuk melihat data yang Anda butuhkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="DEPOSIT_PAID">DP Dibayar</SelectItem>
                  <SelectItem value="CONFIRMED">Terkonfirmasi</SelectItem>
                  <SelectItem value="CHECKED_IN">Sudah Check-in</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaseType">Masa Sewa</Label>
              <Select value={leaseType} onValueChange={setLeaseType}>
                <SelectTrigger id="leaseType">
                  <SelectValue placeholder="Semua Masa Sewa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Masa Sewa</SelectItem>
                  <SelectItem value="DAILY">Harian</SelectItem>
                  <SelectItem value="WEEKLY">Mingguan</SelectItem>
                  <SelectItem value="MONTHLY">Bulanan</SelectItem>
                  <SelectItem value="QUARTERLY">3 Bulan</SelectItem>
                  <SelectItem value="YEARLY">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Dari Tanggal</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Sampai Tanggal</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchReports()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export & Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Data Booking
            </CardTitle>
            <CardDescription>
              {loading ? "Memuat data..." : `${reports.length} booking ditemukan`}
            </CardDescription>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting || loading || reports.length === 0}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Kode Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>No. HP</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Masa Sewa</TableHead>
                  <TableHead>Sisa Waktu</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-muted-foreground">
                        Tidak ada data booking
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report, index) => (
                    <TableRow key={report.bookingCode}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {report.bookingCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{report.customerName}</span>
                          <span className="text-xs text-muted-foreground">{report.customerEmail || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{report.customerPhone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{report.roomNumber}</span>
                          <span className="text-xs text-muted-foreground">{report.roomType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {translateStatus(report.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(report.checkInDate), "dd/MM/yyyy", { locale: localeId })}</span>
                          {report.actualCheckInAt && (
                            <span className="text-xs text-green-600">
                              ✓ {format(new Date(report.actualCheckInAt), "HH:mm", { locale: localeId })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(report.checkOutDate!), "dd/MM/yyyy", { locale: localeId })}</span>
                          {report.actualCheckOutAt && (
                            <span className="text-xs text-blue-600">
                              ✓ {format(new Date(report.actualCheckOutAt), "HH:mm", { locale: localeId })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{translateLeaseType(report.leaseType)}</span>
                          <span className="text-xs text-muted-foreground">{report.leaseDuration} hari</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.status === "COMPLETED" ? (
                          <span className="text-muted-foreground">-</span>
                        ) : report.remainingDays > 0 ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {report.remainingDays} hari
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Lewat</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(report.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
