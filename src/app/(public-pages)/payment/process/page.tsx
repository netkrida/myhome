"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Script from "next/script";

interface PaymentInfo {
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  booking?: {
    id: string;
    bookingCode: string;
    propertyName?: string;
    roomNumber?: string;
    checkInDate?: string;
    checkOutDate?: string;
  };
}

function PaymentProcessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [snapReady, setSnapReady] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<"success" | "pending" | "error" | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token pembayaran tidak ditemukan");
      setLoading(false);
      return;
    }

    // Validate token and get payment info
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/payments/validate-token?token=${token}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || "Token pembayaran tidak valid atau sudah kadaluarsa");
          setLoading(false);
          return;
        }

        setPaymentInfo(result.data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error validating token:", err);
        setError("Gagal memvalidasi token pembayaran");
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSnapReady = () => {
    setSnapReady(true);
  };

  const handlePayNow = () => {
    if (!token || !window.snap) {
      setError("Sistem pembayaran belum siap. Silakan muat ulang halaman.");
      return;
    }

    setProcessingPayment(true);

    window.snap.pay(token, {
      onSuccess: async (result: any) => {
        console.log("✅ Payment success:", result);
        setPaymentResult("success");
        setProcessingPayment(false);
        
        // Confirm payment from client side (fallback for webhook delay)
        try {
          await fetch("/api/payments/confirm-client", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: result.order_id,
              transactionStatus: result.transaction_status,
              paymentType: result.payment_type,
              transactionTime: result.transaction_time,
              transactionId: result.transaction_id,
            }),
          });
        } catch (err) {
          console.error("Failed to confirm payment from client:", err);
        }
        
        // Redirect to success page
        setTimeout(() => {
          router.push(`/payment/success?orderId=${result.order_id}`);
        }, 2000);
      },
      onPending: (result: any) => {
        console.log("⏳ Payment pending:", result);
        setPaymentResult("pending");
        setProcessingPayment(false);
        // Redirect to pending page
        setTimeout(() => {
          router.push(`/payment/pending?orderId=${result.order_id}`);
        }, 2000);
      },
      onError: (result: any) => {
        console.error("❌ Payment error:", result);
        setPaymentResult("error");
        setProcessingPayment(false);
        setError("Pembayaran gagal. Silakan coba lagi.");
      },
      onClose: () => {
        console.log("🚪 Payment popup closed");
        setProcessingPayment(false);
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Memvalidasi pembayaran...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto border-destructive">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">Pembayaran Gagal</CardTitle>
            <CardDescription className="text-base">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => router.push("/")} variant="outline">
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment result states
  if (paymentResult === "success") {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto border-green-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">Pembayaran Berhasil!</CardTitle>
            <CardDescription className="text-base">
              Anda akan dialihkan ke halaman konfirmasi...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-500" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentResult === "pending") {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto border-yellow-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 text-yellow-500 animate-spin" />
            </div>
            <CardTitle className="text-2xl text-yellow-700">Menunggu Pembayaran</CardTitle>
            <CardDescription className="text-base">
              Anda akan dialihkan ke halaman status pembayaran...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-yellow-500" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main payment process view
  return (
    <>
      {/* Midtrans Snap Script */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
          ? "https://app.midtrans.com/snap/snap.js"
          : "https://app.sandbox.midtrans.com/snap/snap.js"}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onReady={handleSnapReady}
      />

      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CreditCard className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Proses Pembayaran</CardTitle>
            <CardDescription className="text-base">
              Selesaikan pembayaran Anda dengan aman melalui Midtrans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Info */}
            {paymentInfo && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {paymentInfo.booking && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kode Booking</span>
                      <span className="font-mono font-semibold">{paymentInfo.booking.bookingCode}</span>
                    </div>
                    {paymentInfo.booking.propertyName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Properti</span>
                        <span className="font-medium">{paymentInfo.booking.propertyName}</span>
                      </div>
                    )}
                    {paymentInfo.booking.roomNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kamar</span>
                        <span className="font-medium">{paymentInfo.booking.roomNumber}</span>
                      </div>
                    )}
                    {paymentInfo.booking.checkInDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Check-in</span>
                        <span className="font-medium">{formatDate(paymentInfo.booking.checkInDate)}</span>
                      </div>
                    )}
                    {paymentInfo.booking.checkOutDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Check-out</span>
                        <span className="font-medium">{formatDate(paymentInfo.booking.checkOutDate)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Pembayaran</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(paymentInfo.amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <Button
              onClick={handlePayNow}
              disabled={!snapReady || processingPayment}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : !snapReady ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menyiapkan Pembayaran...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Bayar Sekarang
                </>
              )}
            </Button>

            {/* Security Notice */}
            <p className="text-xs text-center text-muted-foreground">
              Pembayaran diproses dengan aman melalui Midtrans. 
              Data kartu Anda tidak akan disimpan di server kami.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Memuat...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentProcessContent />
    </Suspense>
  );
}
