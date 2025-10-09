"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Wallet, TrendingDown, CreditCard, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { BankAccountDTO, BankAccountListItem, BalanceInfo, PayoutDetail } from "@/server/types/bank-account";
import { AddBankAccountDialog } from "@/components/dashboard/adminkos/withdraw/add-bank-account-dialog";
import { WithdrawDialog } from "@/components/dashboard/adminkos/withdraw/withdraw-dialog";
import { PayoutHistoryTable } from "@/components/dashboard/adminkos/withdraw/payout-history-table";

interface WithdrawPageClientProps {
  approvedBankAccount: BankAccountDTO | null;
  balance: BalanceInfo | null;
  payouts: PayoutDetail[];
  bankAccounts: BankAccountListItem[];
}

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500 text-white",
  APPROVED: "bg-green-500 text-white",
  REJECTED: "bg-red-500 text-white",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function WithdrawPageClient({
  approvedBankAccount,
  balance,
  payouts: initialPayouts,
  bankAccounts: initialBankAccounts,
}: WithdrawPageClientProps) {
  const [isAddBankDialogOpen, setIsAddBankDialogOpen] = React.useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = React.useState(false);
  const [payouts, setPayouts] = React.useState(initialPayouts);
  const [bankAccounts, setBankAccounts] = React.useState(initialBankAccounts);
  const [currentBalance, setCurrentBalance] = React.useState(balance);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const refreshData = async () => {
    try {
      // Refresh payouts
      const payoutsResponse = await fetch("/api/adminkos/payouts");
      const payoutsData = await payoutsResponse.json();
      if (payoutsData.success) {
        setPayouts(payoutsData.data);
      }

      // Refresh bank accounts
      const bankAccountsResponse = await fetch("/api/adminkos/bank-accounts");
      const bankAccountsData = await bankAccountsResponse.json();
      if (bankAccountsData.success) {
        setBankAccounts(bankAccountsData.data);
      }

      // Refresh balance from ledger system (new integrated approach)
      const balanceResponse = await fetch("/api/adminkos/ledger/balance");
      const balanceData = await balanceResponse.json();
      if (balanceData.success) {
        // Convert ledger balance format to withdraw balance format
        const ledgerBalance = balanceData.data;
        setCurrentBalance({
          totalBalance: ledgerBalance.totalBalance,
          availableBalance: ledgerBalance.availableBalance,
          depositBalance: 0, // Not used in ledger system
          pendingPayouts: ledgerBalance.totalBalance - ledgerBalance.availableBalance,
          lastCalculated: new Date(),
        });
      } else {
        // Fallback to old balance calculation if ledger not available
        const fallbackResponse = await fetch("/api/adminkos/payouts/balance");
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success) {
          setCurrentBalance(fallbackData.data);
        }
      }

      // Reload page to get updated approved bank account
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Check if there's a pending bank account
  const pendingBankAccount = bankAccounts.find((ba) => ba.status === "PENDING");
  const rejectedBankAccount = bankAccounts.find((ba) => ba.status === "REJECTED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Penarikan Dana</h1>
        <p className="text-muted-foreground">
          Kelola rekening bank dan ajukan penarikan dana dari hasil penjualan
        </p>
      </div>

      {/* No Bank Account - Show Registration Prompt */}
      {!approvedBankAccount && !pendingBankAccount && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <CreditCard className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Belum Ada Rekening Terdaftar</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Silakan daftarkan rekening bank Anda terlebih dahulu untuk dapat melakukan penarikan dana.
              Rekening akan diverifikasi oleh Superadmin.
            </p>
            {rejectedBankAccount && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 max-w-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Pengajuan Sebelumnya Ditolak
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Silakan daftarkan rekening baru dengan data yang benar.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button onClick={() => setIsAddBankDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Rekening Bank
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Bank Account */}
      {pendingBankAccount && !approvedBankAccount && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <CardTitle>Rekening Menunggu Persetujuan</CardTitle>
            </div>
            <CardDescription>
              Pengajuan rekening bank Anda sedang diproses oleh Superadmin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bank:</span>
                <span className="font-medium">{pendingBankAccount.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nomor Rekening:</span>
                <span className="font-medium">{pendingBankAccount.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nama Pemilik:</span>
                <span className="font-medium">{pendingBankAccount.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={statusColors[pendingBankAccount.status]}>
                  {statusLabels[pendingBankAccount.status]}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Bank Account - Show Withdraw Features */}
      {approvedBankAccount && currentBalance && (
        <>
          {/* Balance Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(currentBalance.totalBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo keseluruhan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Tersedia</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentBalance.availableBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dapat ditarik
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penarikan</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(currentBalance.pendingPayouts)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  sudah ditarik
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Registered Bank Account */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rekening Terdaftar</CardTitle>
                  <CardDescription>Rekening bank yang telah disetujui untuk penarikan dana</CardDescription>
                </div>
                <Button onClick={() => setIsWithdrawDialogOpen(true)}>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Tarik Dana
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold text-lg">{approvedBankAccount.bankName}</span>
                  </div>
                  <Badge className={statusColors.APPROVED}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {statusLabels.APPROVED}
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                    <p className="font-medium">{approvedBankAccount.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Pemilik</p>
                    <p className="font-medium">{approvedBankAccount.accountName}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penarikan Dana</CardTitle>
              <CardDescription>
                Daftar pengajuan penarikan dana yang telah Anda buat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutHistoryTable payouts={payouts} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialogs */}
      <AddBankAccountDialog
        open={isAddBankDialogOpen}
        onOpenChange={setIsAddBankDialogOpen}
        onSuccess={refreshData}
      />

      {approvedBankAccount && currentBalance && (
        <WithdrawDialog
          open={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          onSuccess={refreshData}
          bankAccount={approvedBankAccount}
          balance={currentBalance}
        />
      )}
    </div>
  );
}

