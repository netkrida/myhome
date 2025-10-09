"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Calendar, Clock, User } from "lucide-react";
import type { ReceptionistListItem, ReceptionistDetail } from "@/server/types/receptionist";
import { Shift } from "@prisma/client";

interface ReceptionistDetailDrawerProps {
  receptionist: ReceptionistListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

const shiftLabels: Record<Shift, string> = {
  MORNING: "Pagi",
  EVENING: "Siang",
  NIGHT: "Malam",
};

const shiftColors: Record<Shift, string> = {
  MORNING: "bg-emerald-100 text-emerald-800",
  EVENING: "bg-blue-100 text-blue-800",
  NIGHT: "bg-purple-100 text-purple-800",
};

export function ReceptionistDetailDrawer({
  receptionist,
  open,
  onOpenChange,
  onRefresh,
}: ReceptionistDetailDrawerProps) {
  const [detail, setDetail] = React.useState<ReceptionistDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && receptionist) {
      fetchDetail();
    }
  }, [open, receptionist]);

  const fetchDetail = async () => {
    if (!receptionist) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/adminkos/receptionist/${receptionist.id}`);
      const data = await response.json();

      if (data.success) {
        setDetail(data.data);
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!receptionist) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detail Receptionist</SheetTitle>
          <SheetDescription>
            Informasi lengkap receptionist dan riwayat shift
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Profile Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={detail?.image} alt={receptionist.name} />
                <AvatarFallback>{getInitials(receptionist.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{receptionist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {receptionist.gender === "MALE" ? "Laki-laki" : receptionist.gender === "FEMALE" ? "Perempuan" : "-"}
                </p>
                <div className="mt-2">
                  <Badge variant={receptionist.isActive ? "default" : "secondary"}>
                    {receptionist.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-medium">Informasi Kontak</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{receptionist.email}</span>
                </div>
                {receptionist.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{receptionist.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Assignment Info */}
            <div className="space-y-3">
              <h4 className="font-medium">Penugasan</h4>
              <div className="space-y-2">
                {receptionist.propertyName ? (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{receptionist.propertyName}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ditugaskan ke properti</p>
                )}

                {receptionist.defaultShift && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Shift Default:</span>
                    <Badge className={shiftColors[receptionist.defaultShift]}>
                      {shiftLabels[receptionist.defaultShift]}
                    </Badge>
                  </div>
                )}

                {receptionist.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Mulai Bekerja: {new Date(receptionist.startDate).toLocaleDateString("id-ID")}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Statistics */}
            {detail && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Shift Bulan Ini
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{detail.totalShiftsThisMonth}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Jam Kerja
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{detail.totalHoursThisMonth}h</div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Recent Shifts */}
                <div className="space-y-3">
                  <h4 className="font-medium">Riwayat Shift (7 Hari Terakhir)</h4>
                  {detail.recentShifts.length > 0 ? (
                    <div className="space-y-2">
                      {detail.recentShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={shiftColors[shift.shiftType]}>
                                {shiftLabels[shift.shiftType]}
                              </Badge>
                              <span className="text-sm font-medium">
                                {new Date(shift.date).toLocaleDateString("id-ID", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {shift.startTime} - {shift.endTime}
                            </div>
                            {shift.notes && (
                              <div className="text-xs text-muted-foreground italic">
                                {shift.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada riwayat shift</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

