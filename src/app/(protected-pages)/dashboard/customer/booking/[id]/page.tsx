"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/ui/animated-card";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { ExtendBookingDialog } from "@/components/booking/extend-booking-dialog";
import {
  ArrowLeft,
  Calendar,
  Home,
  User,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Share2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface BookingDetail {
  id: string;
  bookingCode: string;
  userId: string;
  propertyId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate?: string;
  leaseType: string;
  totalAmount: number;
  depositAmount?: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  property?: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    roomNumber: string;
    roomType: string;
    monthlyPrice: number;
  };
  payments?: Array<{
    id: string;
    paymentType: string;
    paymentMethod?: string;
    amount: number;
    status: string;
    transactionTime?: string;
    transactionId?: string;
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings/${bookingId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch booking details");
      }

      setBooking(result);
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      setError(err.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      UNPAID: { label: "Belum Dibayar", variant: "destructive" },
      DEPOSIT_PAID: { label: "DP Dibayar", variant: "secondary" },
      CONFIRMED: { label: "Terkonfirmasi", variant: "default" },
      CHECKED_IN: { label: "Check-in", variant: "default" },
      CHECKED_OUT: { label: "Check-out", variant: "secondary" },
      COMPLETED: { label: "Selesai", variant: "outline" },
      CANCELLED: { label: "Dibatalkan", variant: "destructive" },
      EXPIRED: { label: "Kadaluarsa", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      PENDING: { label: "Menunggu", variant: "secondary", icon: Clock },
      SUCCESS: { label: "Berhasil", variant: "default", icon: CheckCircle2 },
      FAILED: { label: "Gagal", variant: "destructive", icon: XCircle },
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: localeId });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: localeId });
  };

  // Check if booking is eligible for extension
  const canExtendBooking = () => {
    if (!booking) return false;
    // Can extend if status is CONFIRMED, CHECKED_IN, or DEPOSIT_PAID
    const eligibleStatuses = ["CONFIRMED", "CHECKED_IN", "DEPOSIT_PAID"];
    return eligibleStatuses.includes(booking.status);
  };

  const handleExtendSuccess = (paymentUrl: string) => {
    // Redirect to payment URL or refresh the page
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
    }
    // Refresh booking details after extension
    fetchBookingDetail();
  };

  if (loading) {
    return (
      <CustomerLayout>
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !booking) {
    return (
      <CustomerLayout>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/customer/booking")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Booking
        </Button>
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Gagal Memuat Detail Booking</h3>
            <p className="text-muted-foreground mb-6">{error || "Booking tidak ditemukan"}</p>
            <Button onClick={() => router.push("/dashboard/customer/booking")}>
              Kembali ke Daftar Booking
            </Button>
          </CardContent>
        </Card>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Header Actions */}
      <AnimatedCard>
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/customer/booking")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Bagikan
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Unduh
            </Button>
          </div>
        </div>
      </AnimatedCard>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Info Card */}
          <AnimatedCard delay={0.1}>
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">Detail Booking</CardTitle>
                    <CardDescription className="text-lg font-mono font-semibold text-foreground">
                      {booking.bookingCode}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(booking.status)}
                    {getPaymentStatusBadge(booking.paymentStatus)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Property & Room */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-4 w-4" />
                      <span>Properti</span>
                    </div>
                    <p className="font-semibold text-lg">{booking.property?.name || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Kamar</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {booking.room?.roomNumber || "-"} - {booking.room?.roomType || "-"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Check-in</span>
                    </div>
                    <p className="font-semibold text-lg">{formatDate(booking.checkInDate)}</p>
                  </div>
                  {booking.checkOutDate && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Check-out</span>
                      </div>
                      <p className="font-semibold text-lg">{formatDate(booking.checkOutDate)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          {/* Payment History */}
          {booking.payments && booking.payments.length > 0 && (
            <AnimatedCard delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Riwayat Pembayaran
                  </CardTitle>
                  <CardDescription>
                    Daftar transaksi pembayaran untuk booking ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatedList className="space-y-4">
                    {booking.payments.map((payment, index) => (
                      <AnimatedListItem key={payment.id}>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-semibold">
                                {payment.paymentType === "DEPOSIT" ? "Pembayaran Deposit" : "Pembayaran Penuh"}
                              </p>
                              {getPaymentStatusBadge(payment.status)}
                            </div>
                            {payment.paymentMethod && (
                              <p className="text-sm text-muted-foreground">
                                Metode: <span className="font-medium">{payment.paymentMethod}</span>
                              </p>
                            )}
                            {payment.transactionTime && (
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(payment.transactionTime)}
                              </p>
                            )}
                            {payment.transactionId && (
                              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-block">
                                ID: {payment.transactionId}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-2xl text-primary">
                              {formatCurrency(payment.amount)}
                            </p>
                          </div>
                        </div>
                      </AnimatedListItem>
                    ))}
                  </AnimatedList>
                </CardContent>
              </Card>
            </AnimatedCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <AnimatedCard delay={0.15}>
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipe Sewa</span>
                    <span className="font-semibold">
                      {booking.leaseType === "MONTHLY" ? "Bulanan" : "Harian"}
                    </span>
                  </div>
                  {booking.depositAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit</span>
                      <span className="font-semibold">{formatCurrency(booking.depositAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-xl text-primary">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Extend Booking Button */}
                {canExtendBooking() && (
                  <>
                    <Separator />
                    <Button 
                      onClick={() => setExtendDialogOpen(true)}
                      className="w-full gap-2"
                      variant="default"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Perpanjang Sewa
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          {/* Timestamps */}
          <AnimatedCard delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Tambahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Dibuat pada</p>
                  <p className="font-medium">{formatDateTime(booking.createdAt)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Terakhir diupdate</p>
                  <p className="font-medium">{formatDateTime(booking.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </div>

      {/* Extend Booking Dialog */}
      {booking && (
        <ExtendBookingDialog
          bookingId={booking.id}
          open={extendDialogOpen}
          onOpenChange={setExtendDialogOpen}
          onSuccess={() => fetchBookingDetail()}
        />
      )}
    </CustomerLayout>
  );
}

