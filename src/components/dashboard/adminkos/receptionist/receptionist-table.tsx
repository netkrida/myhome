"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, UserX } from "lucide-react";
import type { ReceptionistListItem } from "@/server/types/receptionist";
import { Shift } from "@prisma/client";

interface ReceptionistTableProps {
  receptionists: ReceptionistListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  onViewDetails: (receptionist: ReceptionistListItem) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const shiftLabels: Record<Shift, string> = {
  MORNING: "Pagi",
  EVENING: "Siang",
  NIGHT: "Malam",
};

const shiftColors: Record<Shift, string> = {
  MORNING: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  EVENING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  NIGHT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export function ReceptionistTable({
  receptionists,
  pagination,
  isLoading,
  onViewDetails,
  onPageChange,
  onRefresh,
}: ReceptionistTableProps) {
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/adminkos/receptionist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert("Gagal mengubah status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Terjadi kesalahan");
    } finally {
      setActionLoading(null);
    }
  };

  // Tambah fungsi hapus receptionist
  const handleDeleteReceptionist = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus receptionist ini?")) return;
    setActionLoading(id);
    try {
      const response = await fetch(`/api/adminkos/receptionist/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onRefresh();
      } else {
        alert("Gagal menghapus receptionist");
      }
    } catch (error) {
      console.error("Error deleting receptionist:", error);
      alert("Terjadi kesalahan");
    } finally {
      setActionLoading(null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (receptionists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <UserX className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Belum ada receptionist</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tambahkan receptionist pertama Anda untuk memulai
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receptionist</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Properti</TableHead>
              <TableHead>Shift Default</TableHead>
              <TableHead>Shift Saat Ini</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receptionists.map((receptionist) => (
              <TableRow key={receptionist.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={undefined} alt={receptionist.name} />
                      <AvatarFallback>{getInitials(receptionist.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{receptionist.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {receptionist.gender === "MALE" ? "Laki-laki" : receptionist.gender === "FEMALE" ? "Perempuan" : "-"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{receptionist.email}</div>
                    <div className="text-muted-foreground">
                      {receptionist.phoneNumber || "-"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {receptionist.propertyName || (
                      <span className="text-muted-foreground">Belum ditugaskan</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {receptionist.defaultShift ? (
                    <Badge className={shiftColors[receptionist.defaultShift]}>
                      {shiftLabels[receptionist.defaultShift]}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {receptionist.currentShift ? (
                    <div className="text-sm">
                      <Badge className={shiftColors[receptionist.currentShift.shiftType]}>
                        {shiftLabels[receptionist.currentShift.shiftType]}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {receptionist.currentShift.startTime} - {receptionist.currentShift.endTime}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Tidak ada shift</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={receptionist.isActive ? "default" : "secondary"}>
                    {receptionist.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={actionLoading === receptionist.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewDetails(receptionist)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(receptionist.id, receptionist.isActive)}>
                        <UserX className="mr-2 h-4 w-4" />
                        {receptionist.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteReceptionist(receptionist.id)}
                        className="text-destructive"
                        disabled={actionLoading === receptionist.id}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {receptionists.length} dari {pagination.total} receptionist
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <div className="text-sm">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

