"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Eye, Pencil, Trash2 } from "lucide-react";
import type { BankAccountDetail } from "@/server/types/bank-account";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BankAccountTableProps {
  accounts: BankAccountDetail[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onUpdate: (id: string, payload: BankAccountUpdatePayload) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

type BankAccountUpdatePayload = Pick<
  BankAccountDetail,
  "bankCode" | "bankName" | "accountNumber" | "accountName"
>;

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500 text-white",
  APPROVED: "bg-green-500 text-white",
  REJECTED: "bg-red-500 text-white",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function BankAccountTable({ accounts, onApprove, onReject, onUpdate, onDelete }: BankAccountTableProps) {
  const [isApproving, setIsApproving] = React.useState<string | null>(null);
  const [isRejecting, setIsRejecting] = React.useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [detailAccountId, setDetailAccountId] = React.useState<string | null>(null);
  const detailAccount = React.useMemo(
    () => (detailAccountId ? accounts.find((account) => account.id === detailAccountId) ?? null : null),
    [accounts, detailAccountId]
  );
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editAccountId, setEditAccountId] = React.useState<string | null>(null);
  const editAccount = React.useMemo(
    () => (editAccountId ? accounts.find((account) => account.id === editAccountId) ?? null : null),
    [accounts, editAccountId]
  );
  const [editForm, setEditForm] = React.useState<BankAccountUpdatePayload>({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteAccountId, setDeleteAccountId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const deleteAccount = React.useMemo(
    () => (deleteAccountId ? accounts.find((account) => account.id === deleteAccountId) ?? null : null),
    [accounts, deleteAccountId]
  );

  React.useEffect(() => {
    if (editAccount) {
      setEditForm({
        bankCode: editAccount.bankCode ?? "",
        bankName: editAccount.bankName ?? "",
        accountNumber: editAccount.accountNumber ?? "",
        accountName: editAccount.accountName ?? "",
      });
    }
  }, [editAccount]);

  const openDetail = (id: string) => {
    setDetailAccountId(id);
    setDetailDialogOpen(true);
  };

  const handleDetailOpenChange = (open: boolean) => {
    setDetailDialogOpen(open);
    if (!open) {
      setDetailAccountId(null);
    }
  };

  const openEdit = (id: string) => {
    setEditAccountId(id);
    setEditDialogOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditAccountId(null);
      setEditForm({
        bankCode: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
      });
    }
  };

  const handleEditChange = (field: keyof BankAccountUpdatePayload) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editAccountId) {
      return;
    }

    setIsUpdating(true);
    try {
      const success = await onUpdate(editAccountId, editForm);
      if (success) {
        handleEditOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating bank account from table:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteAccountId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteAccountId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAccountId) {
      return;
    }

    const currentDeleteId = deleteAccountId;
    setIsDeleting(true);
    try {
      const success = await onDelete(deleteAccountId);
      if (success) {
        handleDeleteOpenChange(false);
        if (detailAccountId === currentDeleteId) {
          handleDetailOpenChange(false);
        }
      }
    } catch (error) {
      console.error("Error deleting bank account from table:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui rekening bank ini?")) {
      return;
    }

    setIsApproving(id);
    try {
      await onApprove(id);
    } finally {
      setIsApproving(null);
    }
  };

  const handleRejectClick = (id: string) => {
    setSelectedAccountId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectOpenChange = (open: boolean) => {
    setRejectDialogOpen(open);
    if (!open) {
      setSelectedAccountId(null);
      setRejectionReason("");
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedAccountId || !rejectionReason.trim()) {
      alert("Alasan penolakan wajib diisi");
      return;
    }

    setIsRejecting(selectedAccountId);
    try {
      await onReject(selectedAccountId, rejectionReason);
      handleRejectOpenChange(false);
    } finally {
      setIsRejecting(null);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tidak ada pengajuan rekening bank</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">No</TableHead>
              <TableHead>AdminKos</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Nomor Rekening</TableHead>
              <TableHead>Nama Pemilik</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account, index) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{account.adminKosName || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{account.adminKosEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{account.bankName}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono">{account.accountNumber}</span>
                </TableCell>
                <TableCell>{account.accountName}</TableCell>
                <TableCell>
                  <Badge className={statusColors[account.status]}>
                    {statusLabels[account.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(account.createdAt), "d MMM yyyy", { locale: idLocale })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openDetail(account.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Detail
                    </Button>
                    {account.status !== "APPROVED" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(account.id)}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(account.id)}
                          disabled={isDeleting && deleteAccountId === account.id}
                        >
                          {isDeleting && deleteAccountId === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Hapus
                        </Button>
                      </>
                    )}
                    {account.status === "PENDING" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(account.id)}
                          disabled={isApproving === account.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {isApproving === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Setuju
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectClick(account.id)}
                          disabled={isRejecting === account.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isRejecting === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>
                  {account.status === "APPROVED" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Disetujui oleh {account.approverName || "Superadmin"}
                    </p>
                  )}
                  {account.status === "REJECTED" && account.rejectionReason && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ditolak: {account.rejectionReason}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent
          className="sm:max-w-xl space-y-6"
          overlayClassName="bg-black/60 backdrop-blur-sm"
        >
          {detailAccount ? (
            <>
              <DialogHeader>
                <DialogTitle>Detail Pengajuan Rekening</DialogTitle>
                <DialogDescription>
                  Informasi profil AdminKos dan rincian rekening bank yang diajukan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Profil AdminKos
                  </h3>
                  <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-6">
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Nama</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detailAccount.adminKosName || "-"}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Email</dt>
                      <dd className="text-sm text-foreground">
                        {detailAccount.adminKosEmail || "-"}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">ID AdminKos</dt>
                      <dd className="text-sm text-foreground break-all">
                        {detailAccount.adminKosId}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Tanggal Pengajuan</dt>
                      <dd className="text-sm text-foreground">
                        {format(new Date(detailAccount.createdAt), "d MMM yyyy", { locale: idLocale })}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Rekening Bank
                  </h3>
                  <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-6">
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Nama Bank</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detailAccount.bankName}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Kode Bank</dt>
                      <dd className="text-sm text-foreground">
                        {detailAccount.bankCode}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Nomor Rekening</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detailAccount.accountNumber}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Nama Pemilik</dt>
                      <dd className="text-sm text-foreground">
                        {detailAccount.accountName}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Status Pengajuan
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={statusColors[detailAccount.status]}>
                      {statusLabels[detailAccount.status]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Diperbarui pada {format(new Date(detailAccount.updatedAt), "d MMM yyyy", { locale: idLocale })}
                    </span>
                  </div>
                  {detailAccount.status === "APPROVED" && (
                    <p className="text-sm text-muted-foreground">
                      Disetujui oleh {detailAccount.approverName || "Superadmin"}
                      {detailAccount.approvedAt
                        ? ` pada ${format(new Date(detailAccount.approvedAt), "d MMM yyyy", { locale: idLocale })}`
                        : ""}
                    </p>
                  )}
                  {detailAccount.status === "REJECTED" && detailAccount.rejectionReason && (
                    <p className="text-sm text-muted-foreground">
                      Alasan penolakan: {detailAccount.rejectionReason}
                    </p>
                  )}
                </section>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteClick(detailAccount.id)}
                  disabled={isDeleting && deleteAccountId === detailAccount.id}
                  className="w-full sm:w-auto"
                >
                  {isDeleting && deleteAccountId === detailAccount.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Pengajuan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Data pengajuan tidak ditemukan.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-lg space-y-0">
          <DialogHeader>
            <DialogTitle>Edit Pengajuan Rekening</DialogTitle>
            <DialogDescription>
              Perbarui data rekening bank sebelum menyetujui pengajuan.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="editBankCode">Kode Bank</Label>
              <Input
                id="editBankCode"
                value={editForm.bankCode}
                onChange={handleEditChange("bankCode")}
                maxLength={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBankName">Nama Bank</Label>
              <Input
                id="editBankName"
                value={editForm.bankName}
                onChange={handleEditChange("bankName")}
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAccountNumber">Nomor Rekening</Label>
              <Input
                id="editAccountNumber"
                value={editForm.accountNumber}
                onChange={handleEditChange("accountNumber")}
                inputMode="numeric"
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAccountName">Nama Pemilik Rekening</Label>
              <Input
                id="editAccountName"
                value={editForm.accountName}
                onChange={handleEditChange("accountName")}
                maxLength={255}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditOpenChange(false)}
                disabled={isUpdating}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isUpdating || !editAccount}>
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={handleRejectOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Pengajuan Rekening</AlertDialogTitle>
            <AlertDialogDescription>
              Berikan alasan penolakan untuk pengajuan rekening bank ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="rejectionReason">Alasan Penolakan *</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Contoh: Data rekening tidak sesuai dengan identitas"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {rejectionReason.length}/500 karakter
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting !== null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={isRejecting !== null || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tolak Pengajuan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengajuan Rekening</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus pengajuan rekening bank. Anda dapat meminta AdminKos
              untuk mengajukan ulang jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteAccount && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-left text-sm text-muted-foreground">
              <p className="font-semibold text-destructive">{deleteAccount.bankName}</p>
              <p className="font-mono text-foreground">{deleteAccount.accountNumber}</p>
              <p className="text-foreground">a.n. {deleteAccount.accountName}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Pengajuan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

