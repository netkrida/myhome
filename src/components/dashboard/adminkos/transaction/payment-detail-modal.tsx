"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentData {
  payment: {
    id: string;
    midtransOrderId: string;
    paymentType: string;
    amount: number;
    status: string;
    paymentMethod?: string;
    transactionTime?: string;
  };
  booking: {
    id: string;
    bookingCode: string;
    status: string;
    paymentStatus: string;
    checkInDate: string;
    totalAmount: number;
    property?: {
      name: string;
    };
    room?: {
      roomNumber: string;
      roomType: string;
    };
  };
}

interface PaymentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
}

export function PaymentDetailModal({ open, onOpenChange, paymentId }: PaymentDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  useEffect(() => {
    if (!open || !paymentId) {
      setLoading(true);
      setError(null);
      setPaymentData(null);
      return;
    }

    const fetchPaymentStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`🔄 Fetching payment details for paymentId: ${paymentId}`);
        const response = await fetch(`/api/payments/${paymentId}`);
        const result = await response.json();

        console.log("📦 Payment status response:", result);

        if (!result.success) {
          console.error("❌ Failed to fetch payment status:", result.error);
          const errorMessage =
            typeof result.error === "string"
              ? result.error
              : result.error?.message || "Gagal mengambil status pembayaran";
          setError(errorMessage);
          return;
        }

        const data = result.data as PaymentData;
        console.log("💳 Payment status:", data.payment.status);
        setPaymentData(data);
      } catch (err: any) {
        console.error("❌ Error fetching payment status:", err);
        const errorMessage =
          typeof err === "string"
            ? err
            : err?.message || "Terjadi kesalahan saat mengambil status pembayaran";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [open, paymentId]);

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    if (error) return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    if (!paymentData) return null;

    switch (paymentData.payment.status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case "PENDING":
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case "FAILED":
      case "EXPIRED":
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <AlertCircle className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    if (loading) return "Memuat Data...";
    if (error) return "Perhatian";
    if (!paymentData) return "Tidak Ada Data";

    switch (paymentData.payment.status) {
      case "SUCCESS":
        return "Pembayaran Berhasil";
      case "PENDING":
        return "Pembayaran Pending";
      case "FAILED":
        return "Pembayaran Gagal";
      case "EXPIRED":
        return "Pembayaran Kadaluarsa";
      default:
        return "Status Pembayaran";
    }
  };

  const getStatusDescription = () => {
    if (loading) return "Mohon tunggu, sedang memuat detail pembayaran...";
    if (error) return error;
    if (!paymentData) return "Data pembayaran tidak ditemukan";

    switch (paymentData.payment.status) {
      case "SUCCESS":
        return "Pembayaran telah berhasil diproses dan booking telah dikonfirmasi";
      case "PENDING":
        return "Pembayaran sedang dalam proses verifikasi";
      case "FAILED":
        return "Pembayaran gagal diproses. Silakan hubungi admin untuk informasi lebih lanjut";
      case "EXPIRED":
        return "Pembayaran telah melewati batas waktu yang ditentukan";
      default:
        return "Status pembayaran tidak diketahui";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detail Pembayaran</DialogTitle>
          <DialogDescription>
            Informasi lengkap mengenai transaksi pembayaran
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Status Section */}
            <div className="flex flex-col items-center justify-center py-6 space-y-3 border-b">
              {getStatusIcon()}
              <div className="text-center">
                <h3 className="text-xl font-semibold">{getStatusTitle()}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {getStatusDescription()}
                </p>
              </div>
            </div>

            {/* Payment Details */}
            {paymentData && (
              <>
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-semibold text-base">Detail Pembayaran</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-medium">{paymentData.payment.midtransOrderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipe Pembayaran</p>
                      <p className="font-medium">
                        {paymentData.payment.paymentType === "DEPOSIT"
                          ? "Deposit"
                          : "Pembayaran Penuh"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah</p>
                      <p className="font-medium text-lg text-green-600">
                        {formatCurrency(paymentData.payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {paymentData.payment.status === "SUCCESS" && "Berhasil"}
                        {paymentData.payment.status === "PENDING" && "Pending"}
                        {paymentData.payment.status === "FAILED" && "Gagal"}
                        {paymentData.payment.status === "EXPIRED" && "Kadaluarsa"}
                      </p>
                    </div>
                    {paymentData.payment.paymentMethod && (
                      <div>
                        <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                        <p className="font-medium capitalize">
                          {paymentData.payment.paymentMethod.replace(/_/g, " ")}
                        </p>
                      </div>
                    )}
                    {paymentData.payment.transactionTime && (
                      <div>
                        <p className="text-sm text-muted-foreground">Waktu Transaksi</p>
                        <p className="font-medium">
                          {format(
                            new Date(paymentData.payment.transactionTime),
                            "dd MMM yyyy, HH:mm"
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-semibold text-base">Detail Booking</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Kode Booking</p>
                      <p className="font-medium">{paymentData.booking.bookingCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status Booking</p>
                      <p className="font-medium">
                        {(() => {
                          switch (paymentData.booking.status) {
                            case "DEPOSIT_PAID":
                              return "Deposit Dibayar";
                            case "CONFIRMED":
                              return "Terkonfirmasi";
                            case "UNPAID":
                              return "Belum Dibayar";
                            case "CANCELLED":
                              return "Dibatalkan";
                            case "CHECKED_IN":
                              return "Sudah Check-in";
                            case "COMPLETED":
                              return "Selesai";
                            case "EXPIRED":
                              return "Kadaluarsa";
                            default:
                              return paymentData.booking.status || "-";
                          }
                        })()}
                      </p>
                    </div>
                    {paymentData.booking.property && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Properti</p>
                        <p className="font-medium">{paymentData.booking.property.name}</p>
                      </div>
                    )}
                    {paymentData.booking.room && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Kamar</p>
                        <p className="font-medium">
                          {paymentData.booking.room.roomType} - Nomor{" "}
                          {paymentData.booking.room.roomNumber}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Tanggal Check-in</p>
                      <p className="font-medium">
                        {format(new Date(paymentData.booking.checkInDate), "dd MMMM yyyy")}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                      <p className="font-medium text-lg">
                        {formatCurrency(paymentData.booking.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                {paymentData.payment.status === "SUCCESS" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>✓ Pembayaran Dikonfirmasi:</strong> Transaksi ini telah berhasil
                      diproses dan tercatat dalam sistem pembukuan.
                    </p>
                  </div>
                )}

                {paymentData.payment.status === "PENDING" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ Menunggu Konfirmasi:</strong> Pembayaran sedang dalam proses
                      verifikasi. Silakan tunggu beberapa saat.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Error state */}
            {error && !paymentData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            )}
          </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
}
