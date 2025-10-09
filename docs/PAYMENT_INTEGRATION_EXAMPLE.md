# Payment Integration Examples

Contoh penggunaan Midtrans payment integration di berbagai bagian aplikasi.

## 📋 Daftar Isi

1. [Booking Detail Page](#booking-detail-page)
2. [Booking List Page](#booking-list-page)
3. [Admin Payment Management](#admin-payment-management)
4. [Custom Payment Flow](#custom-payment-flow)

## 1. Booking Detail Page

Contoh implementasi payment button di halaman detail booking customer.

### File: `app/(customer)/bookings/[id]/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentButton } from "@/components/payment/payment-button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface Booking {
  id: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  depositAmount?: number;
  checkInDate: string;
  property: {
    name: string;
  };
  room: {
    roomNumber: string;
    roomType: string;
  };
  payments: Array<{
    id: string;
    paymentType: string;
    status: string;
    amount: number;
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, []);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${params.id}`);
      const result = await response.json();
      
      if (result.success) {
        setBooking(result.data);
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!booking) return <div>Booking not found</div>;

  // Check if deposit payment is needed
  const hasDepositPayment = booking.payments.some(
    p => p.paymentType === "DEPOSIT" && p.status === "SUCCESS"
  );
  const hasFullPayment = booking.payments.some(
    p => p.paymentType === "FULL" && p.status === "SUCCESS"
  );

  const needsDepositPayment = !hasDepositPayment && booking.depositAmount && booking.depositAmount > 0;
  const needsFullPayment = !hasFullPayment && (hasDepositPayment || !booking.depositAmount);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Detail Booking - {booking.bookingCode}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Properti</p>
              <p className="font-medium">{booking.property.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kamar</p>
              <p className="font-medium">
                {booking.room.roomType} - {booking.room.roomNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-in</p>
              <p className="font-medium">
                {format(new Date(booking.checkInDate), "dd MMMM yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{booking.status}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Informasi Pembayaran</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Total Pembayaran:</span>
                <span className="font-semibold">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
              {booking.depositAmount && (
                <div className="flex justify-between">
                  <span>Deposit:</span>
                  <span className="font-semibold">
                    {formatCurrency(booking.depositAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Actions */}
            <div className="space-y-3">
              {needsDepositPayment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    Silakan bayar deposit untuk mengkonfirmasi booking Anda
                  </p>
                  <PaymentButton
                    bookingId={booking.id}
                    paymentType="DEPOSIT"
                    amount={booking.depositAmount!}
                    className="w-full"
                  >
                    Bayar Deposit {formatCurrency(booking.depositAmount!)}
                  </PaymentButton>
                </div>
              )}

              {needsFullPayment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    {hasDepositPayment 
                      ? "Lanjutkan dengan pembayaran penuh"
                      : "Bayar penuh untuk mengkonfirmasi booking"
                    }
                  </p>
                  <PaymentButton
                    bookingId={booking.id}
                    paymentType="FULL"
                    amount={
                      hasDepositPayment
                        ? booking.totalAmount - (booking.depositAmount || 0)
                        : booking.totalAmount
                    }
                    className="w-full"
                  >
                    Bayar Penuh {formatCurrency(
                      hasDepositPayment
                        ? booking.totalAmount - (booking.depositAmount || 0)
                        : booking.totalAmount
                    )}
                  </PaymentButton>
                </div>
              )}

              {hasFullPayment && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✓ Pembayaran telah selesai
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          {booking.payments.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Riwayat Pembayaran</h3>
              <div className="space-y-2">
                {booking.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {payment.paymentType === "DEPOSIT" ? "Deposit" : "Pembayaran Penuh"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      payment.status === "SUCCESS" 
                        ? "bg-green-100 text-green-800"
                        : payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {payment.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 2. Booking List Page

Contoh menampilkan status pembayaran di list booking.

### File: `app/(customer)/bookings/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const response = await fetch("/api/bookings");
    const result = await response.json();
    if (result.success) {
      setBookings(result.data.bookings);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Booking Saya</h1>
      
      <div className="space-y-4">
        {bookings.map((booking: any) => (
          <Card key={booking.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold">{booking.property.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.room.roomType} - {booking.room.roomNumber}
                  </p>
                  <p className="text-sm">
                    Kode: <span className="font-mono">{booking.bookingCode}</span>
                  </p>
                </div>
                
                <div className="text-right space-y-2">
                  <div className={`px-3 py-1 rounded-full text-sm inline-block ${
                    booking.status === "CONFIRMED" 
                      ? "bg-green-100 text-green-800"
                      : booking.status === "DEPOSIT_PAID"
                      ? "bg-blue-100 text-blue-800"
                      : booking.status === "UNPAID"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {booking.status}
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(booking.totalAmount)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                >
                  Lihat Detail
                </Button>
                
                {booking.status === "UNPAID" && (
                  <Button
                    onClick={() => router.push(`/bookings/${booking.id}#payment`)}
                  >
                    Bayar Sekarang
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## 3. Admin Payment Management

Contoh untuk admin melihat dan mengelola pembayaran.

### File: `app/dashboard/adminkos/payments/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const response = await fetch("/api/admin/payments");
    const result = await response.json();
    if (result.success) {
      setPayments(result.data);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">Booking</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Tipe</th>
                  <th className="text-right p-2">Jumlah</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b">
                    <td className="p-2 font-mono text-sm">
                      {payment.midtransOrderId}
                    </td>
                    <td className="p-2">{payment.booking.bookingCode}</td>
                    <td className="p-2">{payment.booking.user.name}</td>
                    <td className="p-2">
                      {payment.paymentType === "DEPOSIT" ? "Deposit" : "Penuh"}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === "SUCCESS"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 4. Custom Payment Flow

Contoh custom flow dengan konfirmasi sebelum payment.

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

export function CustomPaymentFlow({ booking }: { booking: any }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create payment token
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentType: "DEPOSIT",
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Load and open Snap
      const { token } = result.data;
      (window as any).snap.pay(token);
      
      setShowConfirm(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowConfirm(true)}>
        Bayar Deposit
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              Anda akan melakukan pembayaran deposit untuk booking ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <div className="flex justify-between">
              <span>Booking Code:</span>
              <span className="font-semibold">{booking.bookingCode}</span>
            </div>
            <div className="flex justify-between">
              <span>Jumlah Deposit:</span>
              <span className="font-semibold">
                {formatCurrency(booking.depositAmount)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={loading}>
              {loading ? "Memproses..." : "Lanjutkan Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## 📝 Notes

1. **Payment Button Component** sudah handle loading state dan error
2. **Snap Script** di-load secara dinamis saat pertama kali dibutuhkan
3. **Redirect URLs** di-handle oleh Midtrans configuration
4. **Status Polling** dilakukan di success/pending pages
5. **Error Handling** menggunakan toast notifications

## 🔗 Related Files

- Payment Button: `src/components/payment/payment-button.tsx`
- Success Page: `src/app/(public-pages)/payment/success/page.tsx`
- Failed Page: `src/app/(public-pages)/payment/failed/page.tsx`
- Pending Page: `src/app/(public-pages)/payment/pending/page.tsx`

