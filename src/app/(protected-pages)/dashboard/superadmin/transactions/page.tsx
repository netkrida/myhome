"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  FiltersBar,
  SummaryCards,
  TransactionsLineChart,
  PaymentMethodPie,
  TransactionsTable,
  TransactionDetailDialog,
} from "@/components/dashboard/superadmin/transactions";
import type { TransactionFilters } from "@/components/dashboard/superadmin/transactions/filters-bar";
import { toast } from "sonner";

interface TransactionSummary {
  totalTransactions: number;
  totalRevenue: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  failedAmount: number;
  refundedAmount: number;
  averageOrderValue: number;
}

interface TimeSeriesDataPoint {
  date: string;
  revenue: number;
  count: number;
}

interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

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

export default function TransactionsPage() {
  // State
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    // Set dateFrom to 1 year ago at start of day
    const dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    dateFrom.setHours(0, 0, 0, 0);

    // Set dateTo to tomorrow end of day to handle timezone issues
    // Some payment gateways return transaction_time in different timezones
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + 1); // Add 1 day
    dateTo.setHours(23, 59, 59, 999);

    return {
      dateFrom,
      dateTo,
    };
  });
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Data state
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[] | null>(null);
  const [methodBreakdown, setMethodBreakdown] = useState<PaymentMethodBreakdown[] | null>(
    null
  );
  const [transactions, setTransactions] = useState<{
    transactions: TransactionListItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  } | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Loading state
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isLoadingTable, setIsLoadingTable] = useState(true);

  // Fetch summary
  useEffect(() => {
    fetchSummary();
  }, [filters]);

  // Fetch chart data
  useEffect(() => {
    fetchChartData();
  }, [filters, granularity]);

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, [filters, page]);

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const buildQueryString = (additionalParams: Record<string, any> = {}) => {
    const params = new URLSearchParams();

    if (filters.dateFrom) {
      params.append("dateFrom", filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      params.append("dateTo", filters.dateTo.toISOString());
    }
    if (filters.status) {
      params.append("status", filters.status);
    }
    if (filters.paymentType) {
      params.append("paymentType", filters.paymentType);
    }
    if (filters.paymentMethod) {
      params.append("paymentMethod", filters.paymentMethod);
    }
    if (filters.propertyId) {
      params.append("propertyId", filters.propertyId);
    }
    if (filters.ownerId) {
      params.append("ownerId", filters.ownerId);
    }
    if (filters.search) {
      params.append("search", filters.search);
    }

    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  };

  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/superadmin/transactions/summary?${queryString}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        toast.error(result.error?.message || "Gagal memuat summary");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Gagal memuat summary");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchChartData = async () => {
    setIsLoadingChart(true);
    try {
      const queryString = buildQueryString({ granularity });
      const response = await fetch(`/api/superadmin/transactions/chart?${queryString}`);
      const result = await response.json();

      if (result.success && result.data) {
        setTimeSeries(result.data.timeSeries);
        setMethodBreakdown(result.data.methodBreakdown);
      } else {
        toast.error(result.error?.message || "Gagal memuat chart data");
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast.error("Gagal memuat chart data");
    } finally {
      setIsLoadingChart(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLoadingTable(true);
    try {
      const queryString = buildQueryString({ page, pageSize: 25 });
      const response = await fetch(`/api/superadmin/transactions/list?${queryString}`);
      const result = await response.json();

      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        toast.error(result.error?.message || "Gagal memuat transaksi");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Gagal memuat transaksi");
    } finally {
      setIsLoadingTable(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      // This would need a separate endpoint, for now use empty array
      setPaymentMethods([
        "bank_transfer",
        "credit_card",
        "gopay",
        "qris",
        "shopeepay",
        "alfamart",
        "indomaret",
      ]);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewDetail = (transaction: TransactionListItem) => {
    setSelectedTransaction(transaction.id);
  };

  const handleExport = async () => {
    try {
      toast.loading("Mengekspor transaksi...");

      const queryString = buildQueryString({ format: "csv" });
      const response = await fetch(`/api/superadmin/transactions/export?${queryString}`);

      if (!response.ok) {
        throw new Error("Failed to export transactions");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = (filenameMatch && filenameMatch[1]) || "transactions.csv";

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success("Transaksi berhasil diekspor!");
    } catch (error) {
      console.error("Error exporting transactions:", error);
      toast.dismiss();
      toast.error("Gagal mengekspor transaksi");
    }
  };

  return (
    <DashboardLayout title="Transactions">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Monitor dan kelola semua transaksi pembayaran
          </p>
        </div>

        {/* Filters */}
        <FiltersBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onExport={handleExport}
          paymentMethods={paymentMethods}
        />

        {/* Summary Cards */}
        <SummaryCards data={summary} isLoading={isLoadingSummary} />

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TransactionsLineChart
            data={timeSeries}
            isLoading={isLoadingChart}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
          <PaymentMethodPie data={methodBreakdown} isLoading={isLoadingChart} />
        </div>

        {/* Transactions Table */}
        <TransactionsTable
          data={transactions}
          isLoading={isLoadingTable}
          onPageChange={handlePageChange}
          onViewDetail={handleViewDetail}
        />

        {/* Detail Dialog */}
        <TransactionDetailDialog
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          transactionId={selectedTransaction}
        />
      </div>
    </DashboardLayout>
  );
}

