"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Eye,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface TransactionListItem {
  id: string;
  midtransOrderId: string;
  status: string;
  paymentType: string;
  paymentMethod: string | null;
  amount: number;
  transactionTime: Date | null;
  transactionId: string | null;
  createdAt: Date;
  payer: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  booking: {
    bookingCode: string;
    leaseType: string;
    room: {
      roomNumber: string;
      roomType: string;
      floor: number;
    };
    property: {
      id: string;
      name: string;
      owner: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
}

interface TransactionsTableProps {
  data: {
    transactions: TransactionListItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  } | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onViewDetail: (transaction: TransactionListItem) => void;
}

export function TransactionsTable({
  data,
  isLoading,
  onPageChange,
  onViewDetail,
}: TransactionsTableProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      SUCCESS: {
        label: "Success",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      },
      PENDING: {
        label: "Pending",
        className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      },
      FAILED: {
        label: "Failed",
        className: "bg-rose-500/10 text-rose-700 border-rose-500/20",
      },
      EXPIRED: {
        label: "Expired",
        className: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
      },
      REFUNDED: {
        label: "Refunded",
        className: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
      },
    };

    const statusConfig = config[status] || config["PENDING"];
    if (!statusConfig) return null;
    return (
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Tidak ada transaksi ditemukan
          </div>
        </CardContent>
      </Card>
    );
  }

  const { transactions, pagination } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaksi</CardTitle>
          <p className="text-sm text-muted-foreground">
            {pagination.total.toLocaleString("id-ID")} transaksi
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Waktu</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/50">
                  <TableCell className="text-xs">
                    {tx.transactionTime
                      ? format(new Date(tx.transactionTime), "dd MMM yyyy HH:mm", {
                          locale: localeId,
                        })
                      : format(new Date(tx.createdAt), "dd MMM yyyy HH:mm", {
                          locale: localeId,
                        })}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.midtransOrderId}
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {tx.paymentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {tx.paymentMethod || "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{tx.payer.name}</p>
                      <p className="text-xs text-muted-foreground">{tx.payer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-mono text-xs">{tx.booking.bookingCode}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.booking.leaseType}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{tx.booking.room.roomNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.booking.room.roomType} • Lt.{tx.booking.room.floor}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-sm font-medium truncate">
                      {tx.booking.property.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{tx.booking.property.owner.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {tx.booking.property.owner.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetail(tx)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Detail
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
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(pagination.page - 1) * pagination.pageSize + 1} -{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} dari{" "}
            {pagination.total.toLocaleString("id-ID")} transaksi
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm px-4">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

