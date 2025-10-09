"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentButtonProps {
  bookingId: string;
  paymentType: "DEPOSIT" | "FULL";
  amount: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Payment Button Component
 * 
 * Triggers Midtrans Snap payment flow
 * 
 * Usage:
 * ```tsx
 * <PaymentButton
 *   bookingId="clxxx..."
 *   paymentType="DEPOSIT"
 *   amount={500000}
 * >
 *   Bayar Deposit
 * </PaymentButton>
 * ```
 */
export function PaymentButton({
  bookingId,
  paymentType,
  amount,
  disabled = false,
  className,
  children
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create payment token
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          paymentType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Gagal membuat pembayaran");
      }

      const { token, redirectUrl, orderId } = result.data;

      console.log("🔵 Payment token created:", { orderId, hasToken: !!token });

      // Store orderId in localStorage as backup
      // This is used if Midtrans redirect doesn't include orderId in URL
      const timestamp = Date.now().toString();
      localStorage.setItem('pendingPaymentOrderId', orderId);
      localStorage.setItem('pendingPaymentTimestamp', timestamp);

      console.log("💾 Stored orderId in localStorage:", orderId);
      console.log("💾 Stored timestamp:", timestamp);
      console.log("💾 Verify localStorage:", {
        orderId: localStorage.getItem('pendingPaymentOrderId'),
        timestamp: localStorage.getItem('pendingPaymentTimestamp')
      });

      // Load Midtrans Snap script if not already loaded
      if (!(window as any).snap) {
        await loadSnapScript();
      }

      // Open Snap payment popup
      (window as any).snap.pay(token, {
        onSuccess: function (result: any) {
          console.log("✅ Payment success:", result);
          console.log("🔄 Redirecting to success page with orderId:", orderId);
          // Redirect to success page with orderId
          window.location.href = `/payment/success?orderId=${orderId}`;
        },
        onPending: function (result: any) {
          console.log("⏳ Payment pending:", result);
          console.log("🔄 Redirecting to pending page with orderId:", orderId);
          // Redirect to pending page with orderId
          window.location.href = `/payment/pending?orderId=${orderId}`;
        },
        onError: function (result: any) {
          console.error("❌ Payment error:", result);
          console.log("🔄 Redirecting to failed page with orderId:", orderId);
          // Redirect to failed page with orderId
          window.location.href = `/payment/failed?reason=error&orderId=${orderId}`;
        },
        onClose: function () {
          console.log("🚪 Payment popup closed");
          setLoading(false);
        },
      });

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Gagal memproses pembayaran");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memproses...
        </>
      ) : (
        children || `Bayar ${paymentType === "DEPOSIT" ? "Deposit" : "Penuh"}`
      )}
    </Button>
  );
}

/**
 * Load Midtrans Snap script dynamically
 */
function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.getElementById("midtrans-snap-script");
    if (existingScript) {
      resolve();
      return;
    }

    // Get client key from environment
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      reject(new Error("Midtrans client key not configured"));
      return;
    }

    // Determine script URL based on environment
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const scriptUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    // Create script element
    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    script.onload = () => {
      console.log("Midtrans Snap script loaded");
      resolve();
    };

    script.onerror = () => {
      reject(new Error("Failed to load Midtrans Snap script"));
    };

    document.body.appendChild(script);
  });
}

