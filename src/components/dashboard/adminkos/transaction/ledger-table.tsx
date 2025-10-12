"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LedgerEntryDTO, LedgerQuery } from "@/server/types/ledger";

interface LedgerTableProps {
  entries: LedgerEntryDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading?: boolean;
  onQueryChange: (query: Partial<LedgerQuery>) => void;
  onExport?: () => void;
  onEdit?: (entry: LedgerEntryDTO) => void;
  onDelete?: (entry: LedgerEntryDTO) => void;
  onViewPayment?: (paymentId: string) => void;
}

export function LedgerTable({
  entries,
  pagination,
  isLoading,
  onQueryChange,
  onExport,
  onEdit,
  onDelete,
  onViewPayment
}: LedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    direction: "",
    refType: "",
    accountId: "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRefTypeBadge = (refType: string) => {
    const variants = {
      PAYMENT: { variant: "default" as const, label: "Pembayaran" },
      PAYOUT: { variant: "secondary" as const, label: "Penarikan" },
      MANUAL: { variant: "outline" as const, label: "Manual" },
      ADJUSTMENT: { variant: "destructive" as const, label: "Penyesuaian" },
    };
    
    const config = variants[refType as keyof typeof variants] || { 
      variant: "outline" as const, 
      label: refType 
    };
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const handleSearch = () => {
    onQueryChange({ search: searchTerm, page: 1 });
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const queryUpdate: Partial<LedgerQuery> = { page: 1 };
    if (value) {
      queryUpdate[key as keyof LedgerQuery] = value as any;
    }
    
    onQueryChange(queryUpdate);
  };

  const handleSort = (sortBy: string) => {
    onQueryChange({ sortBy: sortBy as any, page: 1 });
  };

  const handlePageChange = (page: number) => {
    onQueryChange({ page });
  };

  if (isLoading) {
    return <LedgerTableSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Buku Kas</CardTitle>
            <CardDescription>
              Riwayat transaksi keuangan lengkap
            </CardDescription>
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari catatan, referensi, atau akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={filters.direction || "all"} onValueChange={(value) => handleFilterChange("direction", value === "all" ? "" : value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Arah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="IN">Masuk</SelectItem>
                <SelectItem value="OUT">Keluar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.refType || "all"} onValueChange={(value) => handleFilterChange("refType", value === "all" ? "" : value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="PAYMENT">Pembayaran</SelectItem>
                <SelectItem value="PAYOUT">Penarikan</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="ADJUSTMENT">Penyesuaian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("date")}>
                    Tanggal
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-20">Arah</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("amount")}>
                    Jumlah
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Properti</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada transaksi ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {entry.direction === "IN" ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${
                          entry.direction === "IN" ? "text-green-600" : "text-red-600"
                        }`}>
                          {entry.direction === "IN" ? "IN" : "OUT"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{entry.account?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.account?.type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={`font-medium ${
                        entry.direction === "IN" ? "text-green-600" : "text-red-600"
                      }`}>
                        {entry.direction === "IN" ? "+" : "-"}{formatCurrency(entry.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.propertyId ? (
                        <div className="text-sm">{entry.propertyId}</div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRefTypeBadge(entry.refType)}
                        {entry.refId && entry.refType === "PAYMENT" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2"
                            onClick={() => onViewPayment?.(entry.refId!)}
                            title="Lihat detail pembayaran"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48 truncate text-sm">
                        {entry.note || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.refType === "MANUAL" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete?.(entry)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} transaksi
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LedgerTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
          <div className="flex space-x-2">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-36 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
