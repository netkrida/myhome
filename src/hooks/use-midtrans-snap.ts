"use client";

import { useCallback, useEffect, useState } from "react";

interface UseMidtransSnapOptions {
  clientKey?: string;
  snapScriptUrl: string;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void;
    };
  }
}

export function useMidtransSnap({ clientKey, snapScriptUrl }: UseMidtransSnapOptions) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!clientKey) {
      setError("Midtrans client key is not configured");
      return;
    }

    if (window.snap) {
      setIsReady(true);
      return;
    }

    setError(null);

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-midtrans-snap-script="true"]'
    );

    const script = existingScript ?? document.createElement("script");

    script.src = snapScriptUrl;
    script.async = true;
    script.dataset.clientKey = clientKey;
    script.dataset.midtransSnapScript = "true";

    const handleLoad = () => {
      setIsReady(true);
    };

    const handleError = () => {
      setError("Gagal memuat Midtrans Snap. Coba muat ulang halaman.");
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    if (!existingScript) {
      document.body.appendChild(script);
    }

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [clientKey, snapScriptUrl]);

  const pay = useCallback(
    (token: string, options?: Record<string, unknown>) => {
      if (!window.snap) {
        throw new Error("Midtrans Snap belum siap");
      }

      window.snap.pay(token, options);
    },
    []
  );

  return {
    isReady,
    error,
    pay,
  };
}
