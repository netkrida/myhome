"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, Clock } from "lucide-react";
import type { TodayActivityDTO } from "@/server/types/adminkos";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface TodayActivityProps {
  data: TodayActivityDTO;
}

export function TodayActivity({ data }: TodayActivityProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Check-ins Today */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Check-in Hari Ini</CardTitle>
            <LogIn className="h-4 w-4 text-emerald-600" />
          </div>
          <CardDescription>
            {data.checkInsToday.length} booking siap check-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.checkInsToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada check-in hari ini</p>
          ) : (
            <div className="space-y-3">
              {data.checkInsToday.map((booking) => (
                <div key={booking.id} className="flex flex-col space-y-1 border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{booking.customerName}</span>
                    <Badge variant="outline" className="text-xs">
                      {booking.bookingCode}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.propertyName} - {booking.roomNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(booking.checkInDate), "HH:mm", { locale: idLocale })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-outs Today */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Check-out Hari Ini</CardTitle>
            <LogOut className="h-4 w-4 text-rose-600" />
          </div>
          <CardDescription>
            {data.checkOutsToday.length} booking siap check-out
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.checkOutsToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada check-out hari ini</p>
          ) : (
            <div className="space-y-3">
              {data.checkOutsToday.map((booking) => (
                <div key={booking.id} className="flex flex-col space-y-1 border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{booking.customerName}</span>
                    <Badge variant="outline" className="text-xs">
                      {booking.bookingCode}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.propertyName} - {booking.roomNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.checkOutDate && format(new Date(booking.checkOutDate), "HH:mm", { locale: idLocale })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pembayaran Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <CardDescription>
            {data.pendingPayments.length} pembayaran akan kedaluwarsa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.pendingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pembayaran pending</p>
          ) : (
            <div className="space-y-3">
              {data.pendingPayments.map((payment) => (
                <div key={payment.id} className="flex flex-col space-y-1 border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{payment.customerName}</span>
                    <Badge variant="outline" className="text-xs">
                      {payment.bookingCode}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(payment.amount)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Clock className="h-3 w-3" />
                    {payment.hoursUntilExpiry !== null && payment.hoursUntilExpiry < 24 && (
                      <span>{payment.hoursUntilExpiry}h tersisa</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

