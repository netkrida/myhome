"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Search, 
  MoreVertical,
  Archive,
  ArchiveRestore,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react";
import type { LedgerAccountDTO, LedgerAccountQuery } from "@/server/types/ledger";

interface AccountsPanelProps {
  accounts: LedgerAccountDTO[];
  isLoading?: boolean;
  onQueryChange: (query: Partial<LedgerAccountQuery>) => void;
  onCreateAccount: () => void;
  onArchiveAccount: (accountId: string) => void;
  onUnarchiveAccount: (accountId: string) => void;
}

export function AccountsPanel({ 
  accounts, 
  isLoading, 
  onQueryChange,
  onCreateAccount,
  onArchiveAccount,
  onUnarchiveAccount
}: AccountsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "INCOME":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "EXPENSE":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "OTHER":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const variants = {
      INCOME: { variant: "default" as const, label: "Pemasukan" },
      EXPENSE: { variant: "destructive" as const, label: "Pengeluaran" },
      OTHER: { variant: "secondary" as const, label: "Lainnya" },
    };
    
    const config = variants[type as keyof typeof variants] || { 
      variant: "outline" as const, 
      label: type 
    };
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const handleSearch = () => {
    onQueryChange({ 
      search: searchTerm,
      type: typeFilter as any,
      includeArchived: showArchived
    });
  };

  const handleTypeFilterChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setTypeFilter(actualValue);
    onQueryChange({
      type: actualValue as any,
      includeArchived: showArchived
    });
  };

  const handleArchivedToggle = (checked: boolean) => {
    setShowArchived(checked);
    onQueryChange({ 
      includeArchived: checked
    });
  };

  if (isLoading) {
    return <AccountsPanelSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Akun/Kategori</CardTitle>
            <CardDescription>
              Kelola kategori pemasukan dan pengeluaran
            </CardDescription>
          </div>
          <Button onClick={onCreateAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Akun
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode akun..."
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
            <Select value={typeFilter || "all"} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipe Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="INCOME">Pemasukan</SelectItem>
                <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                <SelectItem value="OTHER">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => handleArchivedToggle(!showArchived)}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? "Sembunyikan Arsip" : "Tampilkan Arsip"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50" />
            </div>
            <p className="text-sm">Tidak ada akun ditemukan</p>
            <p className="text-xs mt-1">Buat akun baru untuk mulai mencatat transaksi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  account.isArchived ? "bg-muted/50 border-muted" : "bg-background border-border"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getAccountTypeIcon(account.type)}
                    {account.isSystem && (
                      <Shield className="h-3 w-3 text-amber-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${
                        account.isArchived ? "text-muted-foreground" : ""
                      }`}>
                        {account.name}
                      </h4>
                      {account.code && (
                        <Badge variant="outline" className="text-xs">
                          {account.code}
                        </Badge>
                      )}
                      {getAccountTypeBadge(account.type)}
                      {account.isSystem && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Sistem
                        </Badge>
                      )}
                      {account.isArchived && (
                        <Badge variant="secondary" className="text-xs">
                          Diarsipkan
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span>{account.entriesCount || 0} transaksi</span>
                      {account.totalAmount !== undefined && (
                        <span className={`font-medium ${
                          account.totalAmount >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatCurrency(account.totalAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {!account.isSystem && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {account.isArchived ? (
                        <DropdownMenuItem onClick={() => onUnarchiveAccount(account.id)}>
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Pulihkan
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onArchiveAccount(account.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Arsipkan
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccountsPanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
          <div className="flex space-x-2">
            <div className="h-10 w-36 bg-muted rounded animate-pulse" />
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
