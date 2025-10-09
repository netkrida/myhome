"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle2, FileText } from "lucide-react";
import type { PayoutListItem } from "@/server/types/bank-account";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PayoutTableProps {
  payouts: PayoutListItem[];
  onViewDetail: (payout: PayoutListItem) => void;
  onProcess: (payout: PayoutListItem) => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500 text-white",
  APPROVED: "bg-green-500 text-white",
  REJECTED: "bg-red-500 text-white",
  COMPLETED: "bg-blue-500 text-white",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  COMPLETED: "Selesai",
};

export function PayoutTable({ payouts, onViewDetail, onProcess }: PayoutTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (payouts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Tidak ada pengajuan penarikan dana</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">No</TableHead>
            <TableHead>AdminKos</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Rekening</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout, index) => (
            <TableRow key={payout.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{payout.adminKosName}</div>
                  <div className="text-sm text-muted-foreground">{payout.adminKosEmail}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-bold text-lg">{formatCurrency(payout.amount)}</span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{payout.bankName}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {payout.accountNumber}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[payout.status]}>
                  {statusLabels[payout.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(payout.createdAt), "d MMM yyyy, HH:mm", { locale: idLocale })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(payout)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detail
                  </Button>
                  {payout.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onProcess(payout)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Proses
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

