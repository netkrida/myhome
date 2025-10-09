"use client";

import * as React from "react";
import { X, Mail, Phone, MapPin, Calendar, Clock, CheckCircle2, XCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { ReceptionistDetail } from "@/server/types/receptionist";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ReceptionistDetailCardProps {
  receptionist: ReceptionistDetail;
  onClose: () => void;
}

const shiftColors: Record<string, string> = {
  MORNING: "bg-emerald-500 text-white",
  EVENING: "bg-blue-500 text-white",
  NIGHT: "bg-purple-500 text-white",
};

const shiftLabels: Record<string, string> = {
  MORNING: "Pagi",
  EVENING: "Siang",
  NIGHT: "Malam",
};

export function ReceptionistDetailCard({ receptionist, onClose }: ReceptionistDetailCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">Detail Receptionist</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary/10">
              <AvatarImage src={receptionist.image || undefined} alt={receptionist.name} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials(receptionist.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{receptionist.name}</h3>
              <div className="flex items-center justify-center gap-2">
                <Badge variant={receptionist.isActive ? "default" : "secondary"}>
                  {receptionist.isActive ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Nonaktif
                    </>
                  )}
                </Badge>
                {receptionist.gender && (
                  <Badge variant="outline">
                    <User className="h-3 w-3 mr-1" />
                    {receptionist.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informasi Kontak
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{receptionist.email}</span>
              </div>
              {receptionist.phoneNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Telepon:</span>
                  <span className="font-medium">{receptionist.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Property Assignment */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Penugasan Properti
            </h4>
            {receptionist.propertyName ? (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">{receptionist.propertyName}</div>
                    {receptionist.propertyAddress && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {receptionist.propertyAddress}
                      </div>
                    )}
                    {receptionist.defaultShift && (
                      <div className="mt-2">
                        <Badge className={shiftColors[receptionist.defaultShift]}>
                          Shift Default: {shiftLabels[receptionist.defaultShift]}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Belum ditugaskan ke properti
              </div>
            )}
          </div>

          <Separator />

          {/* Statistics */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Statistik Kerja
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-4">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {receptionist.recentShifts?.length || 0}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Shift (7 Hari)
                </div>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {receptionist.totalShiftsThisMonth || 0}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Shift Bulan Ini
                </div>
              </div>

              <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 col-span-2 md:col-span-1">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {receptionist.totalHoursThisMonth || 0}h
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Jam Kerja Bulan Ini
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recent Shifts */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Riwayat Shift (7 Hari Terakhir)
            </h4>
            {receptionist.recentShifts && receptionist.recentShifts.length > 0 ? (
              <div className="space-y-2">
                {receptionist.recentShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">
                          {format(new Date(shift.date), "EEEE, d MMMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {shift.startTime} - {shift.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={shiftColors[shift.shiftType]}>
                      {shiftLabels[shift.shiftType]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic text-center py-4">
                Belum ada riwayat shift
              </div>
            )}
          </div>

          {/* Additional Info */}
          {receptionist.startDate && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informasi Tambahan
                </h4>
                <div className="text-sm">
                  <span className="text-muted-foreground">Tanggal Mulai Kerja:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(receptionist.startDate), "d MMMM yyyy", {
                      locale: idLocale,
                    })}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

