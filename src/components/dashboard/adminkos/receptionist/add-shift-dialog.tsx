"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { ReceptionistListItem } from "@/server/types/receptionist";
import { Shift } from "@prisma/client";

interface AddShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  propertyId: string;
  receptionists: ReceptionistListItem[];
  selectedDate: Date | null;
  selectedShiftType: Shift | null;
}

const shiftLabels: Record<Shift, string> = {
  MORNING: "Pagi (07:00 - 15:00)",
  EVENING: "Siang (15:00 - 23:00)",
  NIGHT: "Malam (23:00 - 07:00)",
};

const shiftTimeRanges: Record<Shift, { start: string; end: string }> = {
  MORNING: { start: "07:00", end: "15:00" },
  EVENING: { start: "15:00", end: "23:00" },
  NIGHT: { start: "23:00", end: "07:00" },
};

export function AddShiftDialog({
  open,
  onOpenChange,
  onSuccess,
  propertyId,
  receptionists,
  selectedDate,
  selectedShiftType,
}: AddShiftDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [receptionistId, setReceptionistId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReceptionistId("");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receptionistId || !selectedDate || !selectedShiftType) {
      alert("Mohon lengkapi semua field");
      return;
    }

    setIsLoading(true);
    try {
      const timeRange = shiftTimeRanges[selectedShiftType];

      const response = await fetch("/api/adminkos/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receptionistId,
          propertyId,
          shiftType: selectedShiftType,
          date: selectedDate.toISOString(),
          startTime: timeRange.start,
          endTime: timeRange.end,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menambahkan shift");
      }

      alert("Shift berhasil ditambahkan!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding shift:", error);
      alert(error instanceof Error ? error.message : "Gagal menambahkan shift");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDate || !selectedShiftType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Shift</DialogTitle>
          <DialogDescription>
            Assign receptionist untuk shift{" "}
            {selectedDate.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Shift</Label>
            <div className="rounded-lg border p-3 bg-muted">
              <div className="font-medium">{shiftLabels[selectedShiftType]}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receptionist">Receptionist *</Label>
            <Select value={receptionistId} onValueChange={setReceptionistId} required>
              <SelectTrigger id="receptionist">
                <SelectValue placeholder="Pilih receptionist" />
              </SelectTrigger>
              <SelectContent>
                {receptionists.length > 0 ? (
                  receptionists.map((receptionist) => (
                    <SelectItem key={receptionist.id} value={receptionist.id}>
                      {receptionist.name}
                      {receptionist.defaultShift === selectedShiftType && " (Default)"}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    Tidak ada receptionist aktif untuk properti ini
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || receptionists.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

