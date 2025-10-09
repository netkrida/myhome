"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BankAccountDetail } from "@/server/types/bank-account";
import { BankAccountTable } from "@/components/superadmin/reports/bank-account-table";

interface ReportsPageClientProps {
  initialAccounts: BankAccountDetail[];
}

type BankAccountUpdatePayload = Pick<
  BankAccountDetail,
  "bankCode" | "bankName" | "accountNumber" | "accountName"
>;

export function ReportsPageClient({ initialAccounts }: ReportsPageClientProps) {
  const [accounts, setAccounts] = React.useState(initialAccounts);
  const [activeTab, setActiveTab] = React.useState("all");

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/superadmin/bank-accounts/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Rekening bank berhasil disetujui");
        // Refresh data
        await refreshAccounts();
      } else {
        alert(data.error || "Gagal menyetujui rekening bank");
      }
    } catch (error) {
      console.error("Error approving bank account:", error);
      alert("Gagal menyetujui rekening bank");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/superadmin/bank-accounts/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, rejectionReason: reason }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Rekening bank ditolak");
        // Refresh data
        await refreshAccounts();
      } else {
        alert(data.error || "Gagal menolak rekening bank");
      }
    } catch (error) {
      console.error("Error rejecting bank account:", error);
      alert("Gagal menolak rekening bank");
    }
  };

  const refreshAccounts = async () => {
    try {
      const response = await fetch("/api/superadmin/bank-accounts");
      const data = await response.json();

      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error("Error refreshing accounts:", error);
    }
  };

  const handleUpdate = async (
    id: string,
    payload: BankAccountUpdatePayload
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/superadmin/bank-accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert("Rekening bank berhasil diperbarui");
        await refreshAccounts();
        return true;
      }

      alert(data.error || "Gagal memperbarui rekening bank");
      return false;
    } catch (error) {
      console.error("Error updating bank account:", error);
      alert("Gagal memperbarui rekening bank");
      return false;
    }
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/superadmin/bank-accounts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Rekening bank berhasil dihapus");
        await refreshAccounts();
        return true;
      }

      alert(data.error || "Gagal menghapus rekening bank");
      return false;
    } catch (error) {
      console.error("Error deleting bank account:", error);
      alert("Gagal menghapus rekening bank");
      return false;
    }
  };

  const pendingAccounts = accounts.filter((a) => a.status === "PENDING");
  const approvedAccounts = accounts.filter((a) => a.status === "APPROVED");
  const rejectedAccounts = accounts.filter((a) => a.status === "REJECTED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan & Persetujuan</h1>
        <p className="text-muted-foreground">
          Kelola pengajuan rekening bank dari AdminKos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingAccounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pengajuan rekening baru
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedAccounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rekening aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedAccounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pengajuan ditolak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pengajuan Rekening Bank</CardTitle>
          <CardDescription>
            Daftar pengajuan rekening bank dari AdminKos yang perlu diverifikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Semua ({accounts.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingAccounts.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Disetujui ({approvedAccounts.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Ditolak ({rejectedAccounts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <BankAccountTable
                accounts={accounts}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <BankAccountTable
                accounts={pendingAccounts}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <BankAccountTable
                accounts={approvedAccounts}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              <BankAccountTable
                accounts={rejectedAccounts}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

