"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, FileText } from "lucide-react";
import type { PayoutDetail } from "@/server/types/bank-account";

interface PayoutApprovalDialogProps {
  payout: PayoutDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (payoutId: string, attachments: Array<{ fileUrl: string; fileName: string; fileType: string }>) => Promise<void>;
  onReject: (payoutId: string, reason: string) => Promise<void>;
}

export function PayoutApprovalDialog({
  payout,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: PayoutApprovalDialogProps) {
  const [mode, setMode] = React.useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [uploadedFiles, setUploadedFiles] = React.useState<Array<{
    fileUrl: string;
    fileName: string;
    fileType: string;
  }>>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setMode(null);
      setRejectionReason("");
      setUploadedFiles([]);
    }
  }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ml_default"); // You need to set this in Cloudinary
        formData.append("cloud_name", "dg0ybxdbt");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dg0ybxdbt/auto/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (data.secure_url) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              fileUrl: data.secure_url,
              fileName: file.name,
              fileType: file.type,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Gagal mengupload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApprove = async () => {
    if (!payout) return;

    if (uploadedFiles.length === 0) {
      alert("Bukti transfer wajib diupload");
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove(payout.id, uploadedFiles);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!payout) return;

    if (!rejectionReason.trim()) {
      alert("Alasan penolakan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(payout.id, rejectionReason);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payout) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "approve" ? "Setujui Penarikan" : mode === "reject" ? "Tolak Penarikan" : "Proses Penarikan"}
          </DialogTitle>
          <DialogDescription>
            {mode === "approve"
              ? "Upload bukti transfer untuk menyetujui penarikan dana"
              : mode === "reject"
              ? "Berikan alasan penolakan penarikan dana"
              : "Pilih tindakan untuk pengajuan penarikan dana ini"}
          </DialogDescription>
        </DialogHeader>

        {!mode && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">AdminKos:</span>
                <span className="font-medium">{payout.adminKosName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jumlah:</span>
                <span className="font-bold text-lg">{formatCurrency(payout.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rekening:</span>
                <span className="font-medium">
                  {payout.bankAccount?.bankName} - {payout.bankAccount?.accountNumber}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setMode("approve")}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Setujui
              </Button>
              <Button
                onClick={() => setMode("reject")}
                variant="destructive"
                className="flex-1"
              >
                Tolak
              </Button>
            </div>
          </div>
        )}

        {mode === "approve" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Bukti Transfer *</Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Pilih File
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Format: JPG, PNG, PDF (Maks. 5MB per file)
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{file.fileName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode(null)}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting || uploadedFiles.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Setujui Penarikan
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === "reject" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Alasan Penolakan *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Contoh: Saldo tidak mencukupi, data tidak sesuai, dll"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {rejectionReason.length}/500 karakter
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode(null)}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
              <Button
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                variant="destructive"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tolak Penarikan
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

