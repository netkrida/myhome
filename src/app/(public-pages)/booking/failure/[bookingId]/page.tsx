import { notFound, redirect } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export default async function BookingFailurePage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;

  const session = await auth();
  if (!session) {
    redirect(`/login-customer?callbackUrl=${encodeURIComponent(`/booking/failure/${bookingId}`)}`);
  }

  const booking = await getBookingDetail(bookingId);
  if (!booking) {
    notFound();
  }

  const retryUrl = booking.propertyId
    ? `/booking/${booking.propertyId}?roomType=${encodeURIComponent(booking.room?.roomType ?? "")}&roomId=${encodeURIComponent(booking.roomId)}`
    : "/";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Pembayaran Tidak Berhasil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <Alert variant="destructive">
                <AlertTitle>Transaksi belum selesai</AlertTitle>
                <AlertDescription>
                  Kami belum menerima pembayaran untuk booking #{booking.bookingCode}. Coba ulangi proses pembayaran di bawah ini.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Booking Anda</div>
                <div className="mt-2 text-sm text-foreground">
                  {booking.property?.name ?? "Properti"} - {booking.room?.roomType ?? "Tipe kamar"} {booking.room?.roomNumber ? `(${booking.room.roomNumber})` : ""}
                </div>
                <p className="text-xs text-muted-foreground">Kode Booking: {booking.bookingCode}</p>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <a href={retryUrl}>Coba Bayar Lagi</a>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href="/bookings/my">Lihat Booking Saya</a>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Jika kendala berlanjut, hubungi pengelola kos atau tim dukungan kami.
              </p>
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
