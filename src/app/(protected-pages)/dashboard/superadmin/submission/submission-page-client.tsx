"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PayoutListItem, PayoutDetail } from "@/server/types/bank-account";
import { PayoutTable } from "@/components/dashboard/superadmin/submission/payout-table";
import { PayoutDetailDialog } from "@/components/dashboard/superadmin/submission/payout-detail-dialog";
import { PayoutApprovalDialog } from "@/components/dashboard/superadmin/submission/payout-approval-dialog";

interface SubmissionPageClientProps {
  initialPayouts: PayoutListItem[];
}

export function SubmissionPageClient({ initialPayouts }: SubmissionPageClientProps) {
  const [payouts, setPayouts] = React.useState(initialPayouts);
  const [activeTab, setActiveTab] = React.useState("all");
  const [selectedPayout, setSelectedPayout] = React.useState<PayoutDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = React.useState(false);

  const handleViewDetail = async (payout: PayoutListItem) => {
    try {
      const response = await fetch(`/api/superadmin/payouts/${payout.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPayout(data.data);
        setIsDetailDialogOpen(true);
      } else {
        alert("Gagal memuat detail penarikan");
      }
    } catch (error) {
      console.error("Error fetching payout detail:", error);
      alert("Gagal memuat detail penarikan");
    }
  };

  const handleProcess = async (payout: PayoutListItem) => {
    try {
      const response = await fetch(`/api/superadmin/payouts/${payout.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPayout(data.data);
        setIsApprovalDialogOpen(true);
      } else {
        alert("Gagal memuat detail penarikan");
      }
    } catch (error) {
      console.error("Error fetching payout detail:", error);
      alert("Gagal memuat detail penarikan");
    }
  };

  const handleApprove = async (
    payoutId: string,
    attachments: Array<{ fileUrl: string; fileName: string; fileType: string }>
  ) => {
    try {
      const response = await fetch(`/api/superadmin/payouts/${payoutId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, attachments }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Penarikan dana berhasil disetujui");
        await refreshPayouts();
      } else {
        alert(data.error || "Gagal menyetujui penarikan dana");
      }
    } catch (error) {
      console.error("Error approving payout:", error);
      alert("Gagal menyetujui penarikan dana");
    }
  };

  const handleReject = async (payoutId: string, reason: string) => {
    try {
      const response = await fetch(`/api/superadmin/payouts/${payoutId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, rejectionReason: reason }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Penarikan dana ditolak");
        await refreshPayouts();
      } else {
        alert(data.error || "Gagal menolak penarikan dana");
      }
    } catch (error) {
      console.error("Error rejecting payout:", error);
      alert("Gagal menolak penarikan dana");
    }
  };

  const refreshPayouts = async () => {
    try {
      const response = await fetch("/api/superadmin/payouts");
      const data = await response.json();

      if (data.success) {
        setPayouts(data.data);
      }
    } catch (error) {
      console.error("Error refreshing payouts:", error);
    }
  };

  const pendingPayouts = payouts.filter((p) => p.status === "PENDING");
  const approvedPayouts = payouts.filter((p) => p.status === "APPROVED");
  const rejectedPayouts = payouts.filter((p) => p.status === "REJECTED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengajuan Penarikan Dana</h1>
        <p className="text-muted-foreground">
          Kelola pengajuan penarikan dana dari AdminKos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pengajuan penarikan baru
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedPayouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Penarikan disetujui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedPayouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pengajuan ditolak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Penarikan</CardTitle>
          <CardDescription>
            Daftar pengajuan penarikan dana dari AdminKos yang perlu diproses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Semua ({payouts.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingPayouts.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Disetujui ({approvedPayouts.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Ditolak ({rejectedPayouts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <PayoutTable
                payouts={payouts}
                onViewDetail={handleViewDetail}
                onProcess={handleProcess}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <PayoutTable
                payouts={pendingPayouts}
                onViewDetail={handleViewDetail}
                onProcess={handleProcess}
              />
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <PayoutTable
                payouts={approvedPayouts}
                onViewDetail={handleViewDetail}
                onProcess={handleProcess}
              />
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              <PayoutTable
                payouts={rejectedPayouts}
                onViewDetail={handleViewDetail}
                onProcess={handleProcess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PayoutDetailDialog
        payout={selectedPayout}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />

      <PayoutApprovalDialog
        payout={selectedPayout}
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

