"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  paymentType?: string;
  paymentMethod?: string;
  propertyId?: string;
  ownerId?: string;
  search?: string;
}

interface FiltersBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onExport?: () => void;
  paymentMethods?: string[];
}

export function FiltersBar({
  filters,
  onFiltersChange,
  onExport,
  paymentMethods = [],
}: FiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleClearFilters = () => {
    // Keep date range, clear others
    onFiltersChange({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== "dateFrom" && key !== "dateTo"
  ).length;

  return (
    <Card className="sticky top-0 z-10 shadow-md">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Row 1: Search + Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari Order ID, Booking Code, Email, Room..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date From */}
            <div className="w-full sm:w-48">
              <Input
                type="date"
                value={
                  filters.dateFrom
                    ? filters.dateFrom.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleFilterChange(
                    "dateFrom",
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
                className="w-full"
              />
            </div>

            {/* Date To */}
            <div className="w-full sm:w-48">
              <Input
                type="date"
                value={
                  filters.dateTo ? filters.dateTo.toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  handleFilterChange(
                    "dateTo",
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
                className="w-full"
              />
            </div>

            {/* Toggle Advanced Filters */}
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {/* Export Button */}
            {onExport && (
              <Button onClick={onExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>

          {/* Row 2: Advanced Filters (Collapsible) */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={filters.status || "ALL"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "ALL" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Type */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipe Pembayaran</Label>
                <Select
                  value={filters.paymentType || "ALL"}
                  onValueChange={(value) =>
                    handleFilterChange("paymentType", value === "ALL" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="FULL">Full Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Metode Pembayaran</Label>
                <Select
                  value={filters.paymentMethod || "ALL"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "paymentMethod",
                      value === "ALL" ? undefined : value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Metode</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="w-full gap-2"
                  disabled={activeFiltersCount === 0}
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

