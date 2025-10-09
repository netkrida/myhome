"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

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

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Function to fetch latest payment for current user
  const fetchLatestPayment = async () => {
    try {
      console.log("🔍 Fetching latest payment from database...");

      const response = await fetch("/api/payments/latest");
      const result = await response.json();

      console.log("📦 Latest payment response:", result);

      if (!result.success) {
        console.error("❌ Failed to fetch latest payment:", result.error);
        setError("Tidak dapat menemukan pembayaran. Silakan cek di dashboard Anda.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
        setLoading(false);
        return;
      }

      const latestOrderId = result.data.orderId;
      console.log("✅ Latest order ID found:", latestOrderId);

      // Set orderId and let the second useEffect handle fetching payment status
      setOrderId(latestOrderId);

    } catch (err: any) {
      console.error("❌ Error fetching latest payment:", err);
      setError("Terjadi kesalahan. Anda akan diarahkan ke dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔍 Success page loaded");
    console.log("   Search params:", Object.fromEntries(searchParams.entries()));

    // Get orderId from URL
    let orderIdFromUrl = searchParams.get("orderId") || searchParams.get("order_id") || searchParams.get("transaction_id");

    // Check if orderId is the literal placeholder from Midtrans Dashboard
    if (orderIdFromUrl === "{order_id}") {
      orderIdFromUrl = null;
    }

    console.log("   Order ID from URL:", orderIdFromUrl);

    // If orderId not in URL, try to get from localStorage
    if (!orderIdFromUrl) {
      console.log("🔍 Order ID not in URL, checking localStorage...");

      const storedOrderId = localStorage.getItem('pendingPaymentOrderId');
      const storedTimestamp = localStorage.getItem('pendingPaymentTimestamp');

      console.log("   Stored orderId:", storedOrderId);
      console.log("   Stored timestamp:", storedTimestamp);

      // Only use stored orderId if it's recent (within last 10 minutes)
      if (storedOrderId && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp);
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

        if (timestamp > tenMinutesAgo) {
          console.log("✅ Using orderId from localStorage:", storedOrderId);
          orderIdFromUrl = storedOrderId;

          // Clear localStorage after using
          localStorage.removeItem('pendingPaymentOrderId');
          localStorage.removeItem('pendingPaymentTimestamp');
        } else {
          console.log("⏰ Stored orderId is too old, ignoring");
          console.log("   Timestamp:", new Date(timestamp).toISOString());
          console.log("   Ten minutes ago:", new Date(tenMinutesAgo).toISOString());
        }
      } else {
        console.log("❌ No orderId found in localStorage");
      }
    }

    // Set orderId state
    setOrderId(orderIdFromUrl);

    if (!orderIdFromUrl) {
      console.log("⚠️ Order ID tidak ditemukan di URL atau localStorage");
      console.log("💡 Mencoba auto-detect order ID dari database...");

      // Try to auto-detect order ID from database
      // Get latest payment for current user
      fetchLatestPayment();
      return;
    }

    console.log("✅ Order ID found:", orderIdFromUrl);
  }, [searchParams, router]);

  // Second useEffect: Fetch payment status when orderId is available
  useEffect(() => {
    if (!orderId) {
      console.log("⏸️ Skipping payment status fetch - no orderId");
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        console.log(`🔄 Fetching payment status (attempt ${pollCount + 1})...`);
        const response = await fetch(`/api/payments/status?orderId=${orderId}`);
        const result = await response.json();

        console.log("📦 Payment status response:", result);

        if (!result.success) {
          console.error("❌ Failed to fetch payment status:", result.error);

          // Handle error - could be string or object
          const errorMessage = typeof result.error === 'string'
            ? result.error
            : result.error?.message || "Gagal mengambil status pembayaran";

          setError(errorMessage);
          setLoading(false);
          return;
        }

        const data = result.data as PaymentData;
        console.log("💳 Payment status:", data.payment.status);

        // Check if payment is successful
        if (data.payment.status === "SUCCESS") {
          console.log("✅ Payment successful!");
          setPaymentData(data);
          setLoading(false);
        } else if (data.payment.status === "PENDING" && pollCount < 10) {
          // Still pending, poll again after 2 seconds (max 10 times = 20 seconds)
          console.log(`⏳ Payment still pending, polling again in 2s (${pollCount + 1}/10)...`);
          setPollCount(prev => prev + 1);
          setTimeout(fetchPaymentStatus, 2000);
        } else if (data.payment.status === "FAILED" || data.payment.status === "EXPIRED") {
          // Payment failed or expired, redirect to failed page
          console.log(`❌ Payment ${data.payment.status}, redirecting to failed page...`);
          router.push(`/payment/failed?reason=${data.payment.status.toLowerCase()}&orderId=${orderId}`);
        } else {
          // Still pending after max polls
          console.log("⏳ Payment still pending after max polls");
          setError("Pembayaran masih dalam proses. Silakan cek kembali nanti.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("❌ Error fetching payment status:", err);

        // Handle error - could be string or object
        const errorMessage = typeof err === 'string'
          ? err
          : err?.message || "Terjadi kesalahan saat mengambil status pembayaran";

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [orderId, pollCount, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Memverifikasi pembayaran...</p>
              <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <p className="text-lg font-medium">Perhatian</p>
              <p className="text-sm text-muted-foreground text-center">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => window.location.reload()}>
                  Coba Lagi
                </Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  Kembali ke Beranda
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto border-green-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">Pembayaran Berhasil!</CardTitle>
          <CardDescription>
            Terima kasih, pembayaran Anda telah berhasil diproses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-semibold text-lg">Detail Pembayaran</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-medium">{paymentData.payment.midtransOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipe Pembayaran</p>
                <p className="font-medium">
                  {paymentData.payment.paymentType === "DEPOSIT" ? "Deposit" : "Pembayaran Penuh"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah</p>
                <p className="font-medium text-lg text-green-600">
                  {formatCurrency(paymentData.payment.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                <p className="font-medium capitalize">
                  {paymentData.payment.paymentMethod?.replace(/_/g, " ") || "-"}
                </p>
              </div>
              {paymentData.payment.transactionTime && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Waktu Transaksi</p>
                  <p className="font-medium">
                    {format(new Date(paymentData.payment.transactionTime), "dd MMMM yyyy, HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-semibold text-lg">Detail Booking</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kode Booking</p>
                <p className="font-medium">{paymentData.booking.bookingCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Booking</p>
                <p className="font-medium">
                  {paymentData.booking.status === "DEPOSIT_PAID" && "Deposit Dibayar"}
                  {paymentData.booking.status === "CONFIRMED" && "Terkonfirmasi"}
                  {paymentData.booking.status === "UNPAID" && "Belum Dibayar"}
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
                    {paymentData.booking.room.roomType} - {paymentData.booking.room.roomNumber}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Tanggal Check-in</p>
                <p className="font-medium">
                  {format(new Date(paymentData.booking.checkInDate), "dd MMMM yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              className="flex-1"
              onClick={() => router.push(`/bookings/${paymentData.booking.id}`)}
            >
              Lihat Detail Booking
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push("/")}
            >
              Kembali ke Beranda
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Informasi:</strong> Konfirmasi pembayaran telah dikirim ke email Anda. 
              Silakan cek email untuk detail lebih lanjut.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

