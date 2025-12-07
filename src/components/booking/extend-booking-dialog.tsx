"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, CreditCard, Home, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

interface ExtensionInfo {
  bookingId: string;
  bookingCode: string;
  currentCheckOutDate: Date;
  newCheckOutDate: Date;
  leaseType: string;
  extensionAmount: number;
  depositAmount?: number;
  isEligible: boolean;
  reason?: string;
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
  };
  property?: {
    id: string;
    name: string;
  };
}

interface ExtendBookingDialogProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const leaseTypeLabels: Record<string, string> = {
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  QUARTERLY: "3 Bulan",
  YEARLY: "Tahunan",
};

export function ExtendBookingDialog({
  bookingId,
  open,
  onOpenChange,
  onSuccess,
}: ExtendBookingDialogProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [extensionInfo, setExtensionInfo] = React.useState<ExtensionInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  // Form state
  const [periods, setPeriods] = React.useState(1);
  const [depositOption, setDepositOption] = React.useState<"deposit" | "full">("full");

  // Fetch extension info when dialog opens
  React.useEffect(() => {
    if (open && bookingId) {
      fetchExtensionInfo();
    }
  }, [open, bookingId]);

  const fetchExtensionInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}/extend`);
      const result = await response.json();

      if (result.success) {
        setExtensionInfo({
          ...result.data,
          currentCheckOutDate: new Date(result.data.currentCheckOutDate),
          newCheckOutDate: new Date(result.data.newCheckOutDate),
        });
      } else {
        setError(result.error || "Gagal memuat informasi perpanjangan");
      }
    } catch (err) {
      console.error("Error fetching extension info:", err);
      setError("Gagal memuat informasi perpanjangan");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNewCheckOutDate = (currentDate: Date, leaseType: string, numPeriods: number): Date => {
    let date = new Date(currentDate);
    for (let i = 0; i < numPeriods; i++) {
      switch (leaseType) {
        case "DAILY":
          date = addDays(date, 1);
          break;
        case "WEEKLY":
          date = addWeeks(date, 1);
          break;
        case "MONTHLY":
          date = addMonths(date, 1);
          break;
        case "QUARTERLY":
          date = addMonths(date, 3);
          break;
        case "YEARLY":
          date = addYears(date, 1);
          break;
        default:
          date = addMonths(date, 1);
      }
    }
    return date;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async () => {
    if (!extensionInfo) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periods,
          depositOption,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Perpanjangan sewa berhasil dibuat!");
        
        // If payment token is returned, redirect to payment
        if (result.data.paymentToken) {
          // Store for payment page
          localStorage.setItem("pendingPaymentOrderId", result.data.booking.id);
          localStorage.setItem("pendingPaymentTimestamp", Date.now().toString());
          
          // Open Snap payment popup
          if (typeof window !== "undefined" && (window as any).snap) {
            (window as any).snap.pay(result.data.paymentToken, {
              onSuccess: async function(snapResult: any) {
                console.log("✅ Snap onSuccess (extend):", snapResult);
                toast.success("Pembayaran berhasil!");
                
                // Confirm payment from client side (fallback for webhook delay)
                try {
                  await fetch("/api/payments/confirm-client", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId: snapResult.order_id,
                      transactionStatus: snapResult.transaction_status,
                      paymentType: snapResult.payment_type,
                      transactionTime: snapResult.transaction_time,
                      transactionId: snapResult.transaction_id,
                    }),
                  });
                } catch (err) {
                  console.error("Failed to confirm payment from client:", err);
                }
                
                onOpenChange(false);
                onSuccess?.();
              },
              onPending: function(snapResult: any) {
                console.log("⏳ Snap onPending (extend):", snapResult);
                toast.info("Menunggu pembayaran...");
                onOpenChange(false);
                onSuccess?.();
              },
              onError: function(snapResult: any) {
                console.error("❌ Snap onError (extend):", snapResult);
                toast.error("Pembayaran gagal");
              },
              onClose: function() {
                console.log("🚪 Snap closed by user (extend)");
                toast.info("Anda menutup popup pembayaran");
                onSuccess?.();
              }
            });
          } else {
            // Fallback: redirect to payment page
            window.location.href = `/payment/process?token=${result.data.paymentToken}`;
          }
        } else {
          onOpenChange(false);
          onSuccess?.();
        }
      } else {
        toast.error(result.error || "Gagal membuat perpanjangan sewa");
      }
    } catch (err) {
      console.error("Error extending booking:", err);
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate estimated amounts
  const estimatedTotal = extensionInfo 
    ? extensionInfo.extensionAmount * periods 
    : 0;
  const estimatedDeposit = extensionInfo?.depositAmount 
    ? extensionInfo.depositAmount * periods 
    : Math.round(estimatedTotal * 0.3);
  const paymentAmount = depositOption === "deposit" ? estimatedDeposit : estimatedTotal;
  
  // Calculate new check-out date based on periods
  const calculatedCheckOutDate = extensionInfo 
    ? calculateNewCheckOutDate(extensionInfo.currentCheckOutDate, extensionInfo.leaseType, periods)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Perpanjang Masa Sewa
          </DialogTitle>
          <DialogDescription>
            Perpanjang masa sewa kamar Anda untuk periode berikutnya
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={fetchExtensionInfo} className="mt-4">
              Coba Lagi
            </Button>
          </div>
        ) : extensionInfo && !extensionInfo.isEligible ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-amber-700 font-medium">Tidak Dapat Diperpanjang</p>
            <p className="text-sm text-muted-foreground mt-2">{extensionInfo.reason}</p>
          </div>
        ) : extensionInfo ? (
          <div className="space-y-6">
            {/* Current Booking Info */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{extensionInfo.property?.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Kamar {extensionInfo.room.roomNumber} - {extensionInfo.room.roomType}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Masa sewa berakhir:</span>
                <span className="font-medium">
                  {format(extensionInfo.currentCheckOutDate, "d MMMM yyyy", { locale: idLocale })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tipe sewa:</span>
                <Badge variant="outline">{leaseTypeLabels[extensionInfo.leaseType]}</Badge>
              </div>
            </div>

            <Separator />

            {/* Period Selection */}
            <div className="space-y-3">
              <Label>Durasi Perpanjangan</Label>
              <Select
                value={periods.toString()}
                onValueChange={(value) => setPeriods(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 12].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {leaseTypeLabels[extensionInfo.leaseType]?.toLowerCase() || "periode"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New Check-out Date Preview */}
            <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Masa sewa baru berakhir:</span>
              </div>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {calculatedCheckOutDate 
                  ? format(calculatedCheckOutDate, "d MMMM yyyy", { locale: idLocale })
                  : "-"}
              </p>
            </div>

            <Separator />

            {/* Payment Option */}
            <div className="space-y-3">
              <Label>Opsi Pembayaran</Label>
              <RadioGroup
                value={depositOption}
                onValueChange={(value) => setDepositOption(value as "deposit" | "full")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div className="font-medium">Bayar Penuh</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(estimatedTotal)}
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="deposit" id="deposit" />
                  <Label htmlFor="deposit" className="flex-1 cursor-pointer">
                    <div className="font-medium">Bayar Deposit (30%)</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(estimatedDeposit)}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Summary */}
            <div className="rounded-lg border bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary mb-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Ringkasan Pembayaran</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {periods} x {leaseTypeLabels[extensionInfo.leaseType]}
                </span>
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
              {depositOption === "deposit" && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Deposit 30%</span>
                  <span>{formatCurrency(estimatedDeposit)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Bayar</span>
                <span className="text-primary">{formatCurrency(paymentAmount)}</span>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isSubmitting || !extensionInfo?.isEligible}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Lanjutkan ke Pembayaran"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
