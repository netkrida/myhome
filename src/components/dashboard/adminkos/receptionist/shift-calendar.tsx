"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ReceptionistListItem, WeeklyShiftCalendar } from "@/server/types/receptionist";
import { Shift } from "@prisma/client";
import { AddShiftDialog } from "./add-shift-dialog";

interface ShiftCalendarProps {
  properties: Array<{ id: string; name: string }>;
  receptionists: ReceptionistListItem[];
}

const shiftLabels: Record<Shift, string> = {
  MORNING: "Pagi",
  EVENING: "Siang",
  NIGHT: "Malam",
};

const shiftColors: Record<Shift, string> = {
  MORNING: "bg-emerald-500 hover:bg-emerald-600",
  EVENING: "bg-blue-500 hover:bg-blue-600",
  NIGHT: "bg-purple-500 hover:bg-purple-600",
};

const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function ShiftCalendar({ properties, receptionists }: ShiftCalendarProps) {
  const [selectedProperty, setSelectedProperty] = React.useState("");
  const [currentWeekStart, setCurrentWeekStart] = React.useState<Date>(getWeekStart(new Date()));
  const [calendarData, setCalendarData] = React.useState<WeeklyShiftCalendar | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAddShiftOpen, setIsAddShiftOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedShiftType, setSelectedShiftType] = React.useState<Shift | null>(null);

  // Set default property
  React.useEffect(() => {
    if (properties.length > 0 && !selectedProperty && properties[0]) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties]);

  // Fetch calendar data
  React.useEffect(() => {
    if (selectedProperty) {
      fetchCalendar();
    }
  }, [selectedProperty, currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const fetchCalendar = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        propertyId: selectedProperty,
        weekStart: currentWeekStart.toISOString(),
      });

      const response = await fetch(`/api/adminkos/shift/calendar?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCalendarData(data.data);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handleAddShift = (date: Date | string, shiftType: Shift) => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    setSelectedDate(dateObj);
    setSelectedShiftType(shiftType);
    setIsAddShiftOpen(true);
  };

  const handleShiftAdded = () => {
    fetchCalendar();
  };

  const formatDateRange = () => {
    if (!calendarData) return "";
    const start = new Date(calendarData.weekStart);
    const end = new Date(calendarData.weekEnd);
    return `${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Anda belum memiliki properti. Tambahkan properti terlebih dahulu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kalender Shift Mingguan</CardTitle>
              <CardDescription>Atur jadwal shift receptionist</CardDescription>
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih properti" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
              Minggu Sebelumnya
            </Button>
            <div className="font-medium">{formatDateRange()}</div>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              Minggu Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Shift:</span>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-emerald-500" />
              <span>Pagi (07:00-15:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500" />
              <span>Siang (15:00-23:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-purple-500" />
              <span>Malam (23:00-07:00)</span>
            </div>
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : calendarData ? (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-medium text-sm text-muted-foreground">Shift</div>
                  {calendarData.days.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="font-medium text-sm">{dayNames[index]}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shift Rows */}
                {[Shift.MORNING, Shift.EVENING, Shift.NIGHT].map((shiftType) => (
                  <div key={shiftType} className="grid grid-cols-8 gap-2 mb-2">
                    <div className="flex items-center">
                      <Badge className={shiftColors[shiftType]}>
                        {shiftLabels[shiftType]}
                      </Badge>
                    </div>
                    {calendarData.days.map((day, dayIndex) => {
                      const shifts = day.shifts[shiftType] || [];
                      const isPast = new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0));

                      return (
                        <div
                          key={dayIndex}
                          className={`min-h-[80px] rounded-lg border-2 border-dashed p-2 ${
                            isPast ? "bg-muted/50" : "bg-background hover:bg-muted/50"
                          }`}
                        >
                          {shifts.length > 0 ? (
                            <div className="space-y-1">
                              {shifts.map((shift) => (
                                <div
                                  key={shift.id}
                                  className="rounded bg-primary/10 px-2 py-1 text-xs"
                                >
                                  <div className="font-medium truncate">
                                    {shift.receptionistName}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {shift.startTime}-{shift.endTime}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : !isPast ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-full w-full"
                              onClick={() => handleAddShift(day.date, shiftType)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Add Shift Dialog */}
      <AddShiftDialog
        open={isAddShiftOpen}
        onOpenChange={setIsAddShiftOpen}
        onSuccess={handleShiftAdded}
        propertyId={selectedProperty}
        receptionists={receptionists.filter(r => r.propertyId === selectedProperty && r.isActive)}
        selectedDate={selectedDate}
        selectedShiftType={selectedShiftType}
      />
    </div>
  );
}

