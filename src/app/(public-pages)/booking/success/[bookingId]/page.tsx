import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/components/public/property-detail-utils";
import { auth } from "@/server/auth";
import type { BookingDTO } from "@/server/types/booking";

interface BookingApiDTO extends Omit<BookingDTO, "checkInDate" | "checkOutDate" | "createdAt" | "updatedAt"> {
  checkInDate: string;
  checkOutDate?: string;
  createdAt: string;
  updatedAt: string;
}

function resolveBaseUrl() {
  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  return envBase.startsWith("http") ? envBase : `https://${envBase}`;
}

function transformBooking(payload: BookingApiDTO): BookingDTO {
  return {
    ...payload,
    checkInDate: new Date(payload.checkInDate),
    checkOutDate: payload.checkOutDate ? new Date(payload.checkOutDate) : undefined,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  } as BookingDTO;
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookingId } = await params;
  const search = await searchParams;
  const statusParam = typeof search?.status === "string" ? search.status : "success";

  const session = await auth();
  if (!session) {
    redirect(`/login-customer?callbackUrl=${encodeURIComponent(`/booking/success/${bookingId}`)}`);
  }

  const booking = await getBookingDetail(bookingId);
  if (!booking) {
    notFound();
  }

    const propertyAddress =
    (booking.property as { location?: { fullAddress?: string } } | undefined)?.location?.fullAddress ?? null;
const statusLabel = statusParam === "pending" ? "Menunggu Pembayaran" : "Pembayaran Berhasil";
  const statusBadgeVariant = statusParam === "pending" ? "outline" : "default";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-2xl">
                <span>Booking #{booking.bookingCode}</span>
                <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Terima kasih! Kami sudah menerima detail pemesanan Anda. Ringkasan berikut dapat digunakan sebagai bukti ketika check-in.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Properti</div>
                  <div className="text-base font-semibold text-foreground">{booking.property?.name ?? "Properti"}</div>
                  <p className="text-xs text-muted-foreground">
                    {propertyAddress ?? "Alamat akan diinformasikan oleh pengelola"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Kamar</div>
                  <div className="text-base font-semibold text-foreground">
                    {booking.room?.roomType ?? "Tipe kamar"} {booking.room?.roomNumber ? `- ${booking.room.roomNumber}` : ""}
                  </div>
                  <p className="text-xs text-muted-foreground">Durasi sewa: {booking.leaseType.toLowerCase()}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow label="Nama Pemesan" value={booking.user?.name ?? session.user.name ?? "-"} />
                <DetailRow label="Email" value={booking.user?.email ?? session.user.email ?? "-"} />
                <DetailRow label="Check-in" value={format(booking.checkInDate, "EEEE, dd MMMM yyyy")} />
                <DetailRow label="Check-out" value={booking.checkOutDate ? format(booking.checkOutDate, "EEEE, dd MMMM yyyy") : "Sesuai durasi"} />
              </div>

              <div className="space-y-2 rounded-lg border border-border/70 bg-muted/40 p-4">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Tagihan</span>
                  <span>{formatCurrency(booking.totalAmount)}</span>
                </div>
                {booking.depositAmount ? (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Deposit dibayarkan</span>
                    <span>{formatCurrency(booking.depositAmount)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Status Pembayaran</span>
                  <span>{booking.paymentStatus}</span>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-700">
                Simpan halaman ini atau cek menu "My Bookings" untuk melihat status terbaru. Pengelola kos akan menghubungi Anda untuk konfirmasi lebih lanjut.
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="sm" asChild>
                  <a href="/bookings/my">Lihat Booking Saya</a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`/property/${booking.propertyId}`}>Kembali ke Detail Properti</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

async function getBookingDetail(bookingId: string): Promise<BookingDTO | null> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/api/bookings/${encodeURIComponent(bookingId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as BookingApiDTO;
  if (!payload?.id) {
    return null;
  }

  return transformBooking(payload);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}



