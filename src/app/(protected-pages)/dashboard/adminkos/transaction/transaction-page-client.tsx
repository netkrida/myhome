"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarDays, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  BarChart3,
  FileText,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { 
  exportToCSV, 
  formatCurrencyForCSV, 
  formatDateTimeForCSV 
} from "@/lib/export-csv";
import {
  SummaryCards,
  CashFlowChart,
  BreakdownCharts,
  LedgerTable,
  AccountsPanel,
  AddAccountDialog,
  AddTransactionDialog,
} from "@/components/dashboard/adminkos/transaction";
import { EditTransactionDialog } from "@/components/dashboard/adminkos/transaction/edit-transaction-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  LedgerSummaryDTO,
  LedgerTimeSeriesDTO,
  LedgerBreakdownResponse,
  LedgerEntryDTO,
  LedgerAccountDTO,
  LedgerQuery,
  LedgerAccountQuery,
  CreateLedgerAccountDTO,
  CreateLedgerEntryDTO,
} from "@/server/types/ledger";

interface DateRange {
  from: string;
  to: string;
}

export function TransactionPageClient() {
  // State management
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      from: firstDay.toISOString().split('T')[0]!,
      to: lastDay.toISOString().split('T')[0]!,
    };
  });

  const [summary, setSummary] = useState<LedgerSummaryDTO | null>(null);
  const [timeSeries, setTimeSeries] = useState<LedgerTimeSeriesDTO[]>([]);
  const [breakdown, setBreakdown] = useState<LedgerBreakdownResponse | null>(null);
  const [entries, setEntries] = useState<LedgerEntryDTO[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [ledgerQuery, setLedgerQuery] = useState<LedgerQuery>({
    page: 1,
    limit: 20,
    sortBy: "date",
    sortOrder: "desc",
  });

  const [accountQuery, setAccountQuery] = useState<LedgerAccountQuery>({
    includeArchived: false,
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    summary: false,
    timeSeries: false,
    breakdown: false,
    entries: false,
    accounts: false,
    createAccount: false,
    createEntry: false,
    sync: false,
  });

  // Dialog states
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntryDTO | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LedgerEntryDTO | null>(null);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<{
    isHealthy: boolean;
    lastSyncCheck: Date;
    issues?: string[];
  } | null>(null);

  // API calls
  const fetchSummary = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, summary: true }));
    try {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });
      
      const response = await fetch(`/api/adminkos/ledger/summary?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data);
      } else {
        toast.error("Gagal memuat ringkasan keuangan");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoadingStates(prev => ({ ...prev, summary: false }));
    }
  }, [dateRange]);

  const fetchTimeSeries = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, timeSeries: true }));
    try {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        groupBy: "day",
      });
      
      const response = await fetch(`/api/adminkos/ledger/timeseries?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setTimeSeries(result.data);
      } else {
        toast.error("Gagal memuat data time series");
      }
    } catch (error) {
      console.error("Error fetching time series:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoadingStates(prev => ({ ...prev, timeSeries: false }));
    }
  }, [dateRange]);

  const fetchBreakdown = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, breakdown: true }));
    try {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });
      
      const response = await fetch(`/api/adminkos/ledger/breakdown?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setBreakdown(result.data);
      } else {
        toast.error("Gagal memuat breakdown keuangan");
      }
    } catch (error) {
      console.error("Error fetching breakdown:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoadingStates(prev => ({ ...prev, breakdown: false }));
    }
  }, [dateRange]);

  const fetchEntries = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, entries: true }));
    try {
      const params = new URLSearchParams();
      
      // Add query parameters
      Object.entries(ledgerQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (key === "dateFrom" || key === "dateTo") {
            if (value instanceof Date) {
              const dateStr = value.toISOString().split('T')[0];
              if (dateStr) params.append(key, dateStr);
            } else {
              params.append(key, value.toString());
            }
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      const response = await fetch(`/api/adminkos/ledger/entries?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setEntries(result.data.entries);
        setPagination(result.data.pagination);
      } else {
        toast.error("Gagal memuat daftar transaksi");
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoadingStates(prev => ({ ...prev, entries: false }));
    }
  }, [ledgerQuery]);

  const fetchAccounts = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, accounts: true }));
    try {
      const params = new URLSearchParams();
      
      Object.entries(accountQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/adminkos/ledger/accounts?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setAccounts(result.data.accounts);
      } else {
        toast.error("Gagal memuat daftar akun");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoadingStates(prev => ({ ...prev, accounts: false }));
    }
  }, [accountQuery]);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/adminkos/ledger/sync");
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(result.data);
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    }
  }, []);

  // Initialize ledger system
  const initializeLedger = async () => {
    setLoadingStates(prev => ({ ...prev, sync: true }));
    try {
      const response = await fetch("/api/adminkos/ledger/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Sistem pembukuan berhasil diinisialisasi");
        await fetchSyncStatus();
        await refreshAllData();
      } else {
        toast.error("Gagal menginisialisasi sistem pembukuan");
      }
    } catch (error) {
      console.error("Error initializing ledger:", error);
      toast.error("Terjadi kesalahan saat inisialisasi");
    } finally {
      setLoadingStates(prev => ({ ...prev, sync: false }));
    }
  };

  // Create account
  const handleCreateAccount = async (data: CreateLedgerAccountDTO) => {
    setLoadingStates(prev => ({ ...prev, createAccount: true }));
    try {
      const response = await fetch("/api/adminkos/ledger/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Akun berhasil dibuat");
        await fetchAccounts();
      } else {
        const errorMessage = result.error || "Gagal membuat akun";
        toast.error(errorMessage);
        // Throw error to be caught by dialog
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error creating account:", error);
      const errorMessage = error?.message || "Terjadi kesalahan saat membuat akun";
      toast.error(errorMessage);
      // Re-throw to be handled by dialog
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, createAccount: false }));
    }
  };

  // Create transaction
  const handleCreateTransaction = async (data: CreateLedgerEntryDTO) => {
    setLoadingStates(prev => ({ ...prev, createEntry: true }));
    try {
      const response = await fetch("/api/adminkos/ledger/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Transaksi berhasil dicatat");
        await Promise.all([
          fetchEntries(),
          fetchSummary(),
          fetchTimeSeries(),
          fetchBreakdown(),
        ]);
      } else {
        toast.error(result.error || "Gagal mencatat transaksi");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Terjadi kesalahan saat mencatat transaksi");
    } finally {
      setLoadingStates(prev => ({ ...prev, createEntry: false }));
    }
  };

  // Edit transaction
  const handleEditTransaction = (entry: LedgerEntryDTO) => {
    setSelectedEntry(entry);
    setShowEditTransaction(true);
  };

  const handleUpdateTransaction = async (
    entryId: string,
    data: Partial<CreateLedgerEntryDTO>
  ) => {
    try {
      const response = await fetch(`/api/adminkos/ledger/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Transaksi berhasil diupdate");
        await Promise.all([
          fetchEntries(),
          fetchSummary(),
          fetchTimeSeries(),
          fetchBreakdown(),
        ]);
      } else {
        const errorMessage = result.error || "Gagal mengupdate transaksi";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      const errorMessage = error?.message || "Terjadi kesalahan saat mengupdate transaksi";
      toast.error(errorMessage);
      throw error;
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (entry: LedgerEntryDTO) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!entryToDelete) return;

    try {
      const response = await fetch(`/api/adminkos/ledger/entries/${entryToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Transaksi berhasil dihapus");
        setShowDeleteConfirm(false);
        setEntryToDelete(null);
        await Promise.all([
          fetchEntries(),
          fetchSummary(),
          fetchTimeSeries(),
          fetchBreakdown(),
        ]);
      } else {
        toast.error(result.error || "Gagal menghapus transaksi");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Terjadi kesalahan saat menghapus transaksi");
    }
  };

  // Archive/Unarchive account
  const handleArchiveAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/adminkos/ledger/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Akun berhasil diarsipkan");
        await fetchAccounts();
      } else {
        toast.error(result.error || "Gagal mengarsipkan akun");
      }
    } catch (error) {
      console.error("Error archiving account:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleUnarchiveAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/adminkos/ledger/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unarchive" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Akun berhasil dipulihkan");
        await fetchAccounts();
      } else {
        toast.error(result.error || "Gagal memulihkan akun");
      }
    } catch (error) {
      console.error("Error unarchiving account:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
    await Promise.all([
      fetchSummary(),
      fetchTimeSeries(),
      fetchBreakdown(),
      fetchEntries(),
      fetchAccounts(),
    ]);
  };

  // Export transactions to CSV
  const handleExportCSV = () => {
    try {
      if (entries.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      const filename = `transaksi-keuangan_${dateRange.from}_${dateRange.to}.csv`;
      
      exportToCSV(
        entries,
        filename,
        [
          {
            key: "date",
            label: "Tanggal",
            format: (value) => formatDateTimeForCSV(value),
          },
          {
            key: "direction",
            label: "Arah",
            format: (value) => (value === "IN" ? "Masuk" : "Keluar"),
          },
          {
            key: "account",
            label: "Akun",
            format: (value) => value?.name || "-",
          },
          {
            key: "account",
            label: "Tipe Akun",
            format: (value) => value?.type || "-",
          },
          {
            key: "amount",
            label: "Jumlah",
            format: (value) => formatCurrencyForCSV(value),
          },
          {
            key: "refType",
            label: "Referensi Tipe",
            format: (value) => {
              const types: Record<string, string> = {
                PAYMENT: "Pembayaran",
                PAYOUT: "Penarikan",
                MANUAL: "Manual",
                ADJUSTMENT: "Penyesuaian",
              };
              return types[value] || value;
            },
          },
          {
            key: "refId",
            label: "Referensi ID",
            format: (value) => value || "-",
          },
          {
            key: "propertyId",
            label: "Properti ID",
            format: (value) => value || "-",
          },
          {
            key: "note",
            label: "Catatan",
            format: (value) => value || "-",
          },
        ]
      );
      
      toast.success("Data berhasil diekspor");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Gagal mengekspor data");
    }
  };

  // Handle date range change
  const handleDateRangeChange = (field: keyof DateRange, value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const applyDateRange = () => {
    Promise.all([
      fetchSummary(),
      fetchTimeSeries(),
      fetchBreakdown(),
    ]);
  };

  // Handle query changes
  const handleLedgerQueryChange = (updates: Partial<LedgerQuery>) => {
    setLedgerQuery(prev => ({ ...prev, ...updates }));
  };

  const handleAccountQueryChange = (updates: Partial<LedgerAccountQuery>) => {
    setAccountQuery(prev => ({ ...prev, ...updates }));
  };

  // Initial data load
  useEffect(() => {
    fetchSyncStatus();
    refreshAllData();
  }, []);

  // Refetch entries when query changes
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Refetch accounts when query changes
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pembukuan Keuangan</h1>
          <p className="text-muted-foreground">
            Kelola dan pantau arus kas bisnis kos Anda
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddTransaction(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Transaksi
          </Button>
        </div>
      </div>

      {/* Sync Status Alert */}
      {syncStatus && !syncStatus.isHealthy && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sistem pembukuan memerlukan sinkronisasi</p>
                <p className="text-sm mt-1">
                  {syncStatus.issues?.join(", ")}
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={initializeLedger}
                disabled={loadingStates.sync}
              >
                {loadingStates.sync ? "Menginisialisasi..." : "Inisialisasi"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Filter Periode</span>
          </CardTitle>
          <CardDescription>
            Pilih rentang tanggal untuk analisis keuangan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="dateFrom">Dari Tanggal</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateRangeChange("from", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dateTo">Sampai Tanggal</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateRangeChange("to", e.target.value)}
              />
            </div>
            <div className="pt-6">
              <Button onClick={applyDateRange}>
                Terapkan Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <SummaryCards 
          data={summary} 
          isLoading={loadingStates.summary}
        />
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart 
          data={timeSeries} 
          isLoading={loadingStates.timeSeries}
        />
        {breakdown && (
          <BreakdownCharts 
            data={breakdown} 
            isLoading={loadingStates.breakdown}
          />
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Buku Kas</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Akun/Kategori</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-6">
          <LedgerTable
            entries={entries}
            pagination={pagination}
            isLoading={loadingStates.entries}
            onQueryChange={handleLedgerQueryChange}
            onExport={handleExportCSV}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        </TabsContent>
        
        <TabsContent value="accounts" className="mt-6">
          <AccountsPanel
            accounts={accounts}
            isLoading={loadingStates.accounts}
            onQueryChange={handleAccountQueryChange}
            onCreateAccount={() => setShowAddAccount(true)}
            onArchiveAccount={handleArchiveAccount}
            onUnarchiveAccount={handleUnarchiveAccount}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddAccountDialog
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
        onSubmit={handleCreateAccount}
        isLoading={loadingStates.createAccount}
      />

      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        onSubmit={handleCreateTransaction}
        accounts={accounts}
        isLoading={loadingStates.createEntry}
      />

      <EditTransactionDialog
        open={showEditTransaction}
        onOpenChange={setShowEditTransaction}
        entry={selectedEntry}
        accounts={accounts}
        onSubmit={handleUpdateTransaction}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {entryToDelete && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <div className="text-sm space-y-1">
                <div><strong>Akun:</strong> {entryToDelete.account?.name}</div>
                <div><strong>Jumlah:</strong> Rp {entryToDelete.amount.toLocaleString("id-ID")}</div>
                <div><strong>Tanggal:</strong> {new Date(entryToDelete.date).toLocaleDateString("id-ID")}</div>
                {entryToDelete.note && <div><strong>Catatan:</strong> {entryToDelete.note}</div>}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
