"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Users, Calendar } from "lucide-react";
import type { ReceptionistListItem } from "@/server/types/receptionist";
import { Shift } from "@prisma/client";

// Import components
import { ReceptionistTable } from "@/components/dashboard/adminkos/receptionist/receptionist-table";
import { AddReceptionistDialog } from "@/components/dashboard/adminkos/receptionist/add-receptionist-dialog";
import { ReceptionistDetailCard } from "@/components/dashboard/adminkos/receptionist/receptionist-detail-card";
import { ShiftCalendar } from "@/components/dashboard/adminkos/receptionist/shift-calendar";
import type { ReceptionistDetail } from "@/server/types/receptionist";

interface ReceptionistPageClientProps {
  initialReceptionists: ReceptionistListItem[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  properties: Array<{ id: string; name: string }>;
}

export function ReceptionistPageClient({
  initialReceptionists,
  initialPagination,
  properties,
}: ReceptionistPageClientProps) {
  const [activeTab, setActiveTab] = React.useState("list");
  const [receptionists, setReceptionists] = React.useState(initialReceptionists);
  const [pagination, setPagination] = React.useState(initialPagination);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [selectedReceptionistDetail, setSelectedReceptionistDetail] = React.useState<ReceptionistDetail | null>(null);
  const [isDetailCardOpen, setIsDetailCardOpen] = React.useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [propertyFilter, setPropertyFilter] = React.useState<string>("all");
  const [shiftFilter, setShiftFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Fetch receptionists
  const fetchReceptionists = React.useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        if (search) params.append("search", search);
        if (propertyFilter && propertyFilter !== "all") params.append("propertyId", propertyFilter);
        if (shiftFilter && shiftFilter !== "all") params.append("shift", shiftFilter);
        if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

        const response = await fetch(`/api/adminkos/receptionist?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setReceptionists(data.data.receptionists);
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching receptionists:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [search, propertyFilter, shiftFilter, statusFilter]
  );

  // Fetch on filter change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchReceptionists(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, propertyFilter, shiftFilter, statusFilter]);

  const handleViewDetails = async (receptionist: ReceptionistListItem) => {
    setIsLoadingDetail(true);
    setIsDetailCardOpen(true);

    try {
      const response = await fetch(`/api/adminkos/receptionist/${receptionist.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedReceptionistDetail(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch receptionist details");
      }
    } catch (error) {
      console.error("Error fetching receptionist details:", error);
      alert(error instanceof Error ? error.message : "Gagal memuat detail receptionist");
      setIsDetailCardOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailCardOpen(false);
    setSelectedReceptionistDetail(null);
  };

  const handleAddSuccess = () => {
    fetchReceptionists(1);
  };

  const handlePageChange = (page: number) => {
    fetchReceptionists(page);
  };

  const handleResetFilters = () => {
    setSearch("");
    setPropertyFilter("all");
    setShiftFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Receptionist</h1>
          <p className="text-muted-foreground">
            Kelola receptionist dan jadwal shift kerja
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Receptionist
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Users className="h-4 w-4" />
            Daftar Receptionist
          </TabsTrigger>
          <TabsTrigger value="shifts" className="gap-2">
            <Calendar className="h-4 w-4" />
            Pengaturan Shift
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Receptionist</CardTitle>
              <CardDescription>
                Kelola data receptionist yang terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Properti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Properti</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Shift</SelectItem>
                    <SelectItem value={Shift.MORNING}>Pagi</SelectItem>
                    <SelectItem value={Shift.EVENING}>Siang</SelectItem>
                    <SelectItem value={Shift.NIGHT}>Malam</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters */}
              {(search || propertyFilter !== "all" || shiftFilter !== "all" || statusFilter !== "all") && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Reset Filter
                  </Button>
                </div>
              )}

              {/* Table */}
              <ReceptionistTable
                receptionists={receptionists}
                pagination={pagination}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onPageChange={handlePageChange}
                onRefresh={() => fetchReceptionists(pagination.page)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <ShiftCalendar
            properties={properties}
            receptionists={receptionists}
          />
        </TabsContent>
      </Tabs>

      {/* Add Receptionist Dialog */}
      <AddReceptionistDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
        properties={properties}
      />

      {/* Detail Card (Centered Modal) */}
      {isDetailCardOpen && selectedReceptionistDetail && (
        <ReceptionistDetailCard
          receptionist={selectedReceptionistDetail}
          onClose={handleCloseDetail}
        />
      )}

      {/* Loading Detail Overlay */}
      {isDetailCardOpen && isLoadingDetail && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Memuat detail receptionist...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

