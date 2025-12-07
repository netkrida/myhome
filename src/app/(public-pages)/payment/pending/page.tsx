"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, RefreshCw } from "lucide-react";

interface PaymentData {
  payment: {
    id: string;
    midtransOrderId: string;
    paymentType: string;
    amount: number;
    status: string;
    paymentMethod?: string;
    expiryTime?: string;
  };
  booking: {
    id: string;
    bookingCode: string;
    status: string;
  };
}

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status?orderId=${orderId}`);
        const result = await response.json();

        if (!result.success) {
          setLoading(false);
          return;
        }

        const data = result.data as PaymentData;
        setPaymentData(data);

        // Check payment status
        if (data.payment.status === "SUCCESS") {
          // Payment successful, redirect to success page
          router.push(`/payment/success?orderId=${orderId}`);
        } else if (data.payment.status === "FAILED" || data.payment.status === "EXPIRED") {
          // Payment failed or expired, redirect to failed page
          router.push(`/payment/failed?reason=${data.payment.status.toLowerCase()}&orderId=${orderId}`);
        } else if (data.payment.status === "PENDING" && pollCount < 60) {
          // Still pending, poll again after 5 seconds (max 60 times = 5 minutes)
          setPollCount(prev => prev + 1);
          setTimeout(fetchPaymentStatus, 5000);
        } else {
          // Stop polling after max attempts
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching payment status:", err);
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [orderId, pollCount, router]);

  // Function to manually refresh status from Midtrans
  const handleRefreshStatus = async () => {
    if (!orderId || refreshing) return;
    
    setRefreshing(true);
    try {
      const response = await fetch("/api/payments/refresh-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.updated) {
        // Status was updated, check the new status
        if (result.data.currentStatus === "SUCCESS") {
          router.push(`/payment/success?orderId=${orderId}`);
        } else if (result.data.currentStatus === "FAILED" || result.data.currentStatus === "EXPIRED") {
          router.push(`/payment/failed?reason=${result.data.currentStatus.toLowerCase()}&orderId=${orderId}`);
        } else {
          // Refresh the page data
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !paymentData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Memuat informasi pembayaran...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto border-yellow-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl text-yellow-700">Pembayaran Menunggu</CardTitle>
          <CardDescription>
            Pembayaran Anda sedang menunggu konfirmasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentData && (
            <>
              {/* Payment Info */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-semibold text-lg">Informasi Pembayaran</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-medium">{paymentData.payment.midtransOrderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-yellow-600">Menunggu Pembayaran</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kode Booking</p>
                    <p className="font-medium">{paymentData.booking.bookingCode}</p>
                  </div>
                  {paymentData.payment.paymentMethod && (
                    <div>
                      <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                      <p className="font-medium capitalize">
                        {paymentData.payment.paymentMethod.replace(/_/g, " ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Instruksi Pembayaran:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                  <li>Selesaikan pembayaran sesuai metode yang Anda pilih</li>
                  <li>Simpan bukti pembayaran untuk referensi</li>
                  <li>Halaman ini akan otomatis diperbarui setelah pembayaran dikonfirmasi</li>
                  <li>Jika pembayaran tidak selesai, booking akan dibatalkan otomatis</li>
                </ol>
              </div>

              {paymentData.payment.expiryTime && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Perhatian:</strong> Pembayaran akan kadaluarsa pada{" "}
                    {new Date(paymentData.payment.expiryTime).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short"
                    })}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Auto-refresh indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Memeriksa status pembayaran...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              className="flex-1"
              onClick={handleRefreshStatus}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Cek Status Pembayaran
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push("/")}
            >
              Kembali ke Beranda
            </Button>
          </div>

          {/* Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Butuh Bantuan?</strong> Hubungi customer service kami di{" "}
              <a href="mailto:support@myhome.com" className="underline">
                support@myhome.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

