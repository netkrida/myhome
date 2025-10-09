"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, AlertTriangle } from "lucide-react";

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get("reason") || "unknown";
  const orderId = searchParams.get("orderId");

  const [message, setMessage] = useState({
    title: "Pembayaran Gagal",
    description: "Pembayaran Anda tidak dapat diproses",
    details: ""
  });

  useEffect(() => {
    // Set message based on reason
    switch (reason.toLowerCase()) {
      case "error":
        setMessage({
          title: "Terjadi Kesalahan",
          description: "Terjadi kesalahan saat memproses pembayaran",
          details: "Silakan coba lagi atau hubungi customer service jika masalah berlanjut."
        });
        break;
      case "unfinish":
        setMessage({
          title: "Pembayaran Dibatalkan",
          description: "Anda membatalkan proses pembayaran",
          details: "Anda dapat mencoba melakukan pembayaran kembali kapan saja."
        });
        break;
      case "expired":
        setMessage({
          title: "Pembayaran Kadaluarsa",
          description: "Waktu pembayaran telah habis",
          details: "Silakan buat pembayaran baru untuk melanjutkan booking Anda."
        });
        break;
      case "failed":
        setMessage({
          title: "Pembayaran Ditolak",
          description: "Pembayaran Anda ditolak",
          details: "Silakan periksa metode pembayaran Anda dan coba lagi."
        });
        break;
      case "deny":
        setMessage({
          title: "Pembayaran Ditolak",
          description: "Pembayaran Anda ditolak oleh sistem",
          details: "Silakan gunakan metode pembayaran lain atau hubungi bank Anda."
        });
        break;
      default:
        setMessage({
          title: "Pembayaran Gagal",
          description: "Pembayaran Anda tidak dapat diproses",
          details: "Silakan coba lagi atau hubungi customer service."
        });
    }
  }, [reason]);

  const handleRetry = () => {
    if (orderId) {
      // If we have order ID, we could potentially retry the same payment
      // For now, just redirect to home
      router.push("/");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto border-red-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {reason === "unfinish" ? (
              <AlertTriangle className="h-16 w-16 text-yellow-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl text-red-700">{message.title}</CardTitle>
          <CardDescription className="text-base">
            {message.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              {message.details}
            </p>
          </div>

          {orderId && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {orderId}
              </p>
            </div>
          )}

          {/* Possible Reasons */}
          <div className="space-y-2">
            <h3 className="font-semibold">Kemungkinan Penyebab:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Saldo atau limit kartu tidak mencukupi</li>
              <li>Informasi pembayaran tidak valid</li>
              <li>Koneksi internet terputus</li>
              <li>Waktu pembayaran telah habis</li>
              <li>Pembayaran dibatalkan oleh pengguna</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              className="flex-1"
              onClick={handleRetry}
            >
              Coba Lagi
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push("/")}
            >
              Kembali ke Beranda
            </Button>
          </div>

          {/* Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Butuh Bantuan?</strong> Hubungi customer service kami di{" "}
              <a href="mailto:support@myhome.com" className="underline">
                support@myhome.com
              </a>
              {" "}atau WhatsApp{" "}
              <a href="https://wa.me/6281234567890" className="underline" target="_blank" rel="noopener noreferrer">
                +62 812-3456-7890
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

