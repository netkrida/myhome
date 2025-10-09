"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Download } from "lucide-react";
import type { PayoutDetail } from "@/server/types/bank-account";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PayoutHistoryTableProps {
  payouts: PayoutDetail[];
  onViewDetail?: (payout: PayoutDetail) => void;
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

export function PayoutHistoryTable({ payouts, onViewDetail }: PayoutHistoryTableProps) {
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
        <p className="text-muted-foreground">Belum ada riwayat penarikan dana</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">No</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Rekening</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bukti Transfer</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout, index) => (
            <TableRow key={payout.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                {format(new Date(payout.createdAt), "d MMM yyyy, HH:mm", { locale: idLocale })}
              </TableCell>
              <TableCell>
                <span className="font-semibold">{formatCurrency(payout.amount)}</span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{payout.bankAccount?.bankName}</div>
                  <div className="text-sm text-muted-foreground">
                    {payout.bankAccount?.accountNumber}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[payout.status]}>
                  {statusLabels[payout.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {payout.attachments && payout.attachments.length > 0 ? (
                  <div className="space-y-1">
                    {payout.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        {attachment.fileName}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {onViewDetail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(payout)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detail
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

