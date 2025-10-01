import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <Card className="max-w-md overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 text-center shadow">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-semibold text-slate-900">Properti tidak ditemukan</CardTitle>
            <CardDescription className="text-slate-600">
              Properti yang Anda cari mungkin sudah tidak tersedia atau tautannya tidak valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            <Button asChild className="w-full rounded-full">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/search">Cari kos lainnya</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}

