"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type AuthRoleSelectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ROLE_OPTIONS = [
  {
    key: "customer",
    title: "Pemesan",
    description: "Masuk untuk mencari dan memesan kos favoritmu.",
    loginHref: "/login-customer",
    registerHref: "/register-customer",
  },
  {
    key: "adminkos",
    title: "AdminKos",
    description: "Kelola properti kos dan pantau pemesanan dengan dashboard lengkap.",
    loginHref: "/login",
    registerHref: "/register",
  },
] as const;

export function AuthRoleSelectionDialog({ open, onOpenChange }: AuthRoleSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pilih jenis akun</DialogTitle>
          <DialogDescription>
            Silakan pilih peran yang sesuai untuk melanjutkan proses masuk atau daftar akun Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => (
            <Card key={option.key} className="h-full border shadow-sm">
              <CardHeader>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button asChild className="w-full" onClick={() => onOpenChange(false)}>
                  <Link href={option.loginHref}>Masuk sebagai {option.title}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  <Link href={option.registerHref}>Daftar sebagai {option.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-2" />
        <p className="text-xs text-muted-foreground">
          Setelah memilih peran, Anda akan diarahkan ke halaman login atau registrasi sesuai pilihan.
        </p>
      </DialogContent>
    </Dialog>
  );
}
