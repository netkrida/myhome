"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const customerLoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type CustomerLoginFormData = z.infer<typeof customerLoginSchema>;

type CustomerLoginFormProps = {
  callbackUrl?: string;
};

export function CustomerLoginForm({ callbackUrl }: CustomerLoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<CustomerLoginFormData>({
    resolver: zodResolver(customerLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: CustomerLoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      console.log("🔍 Customer login attempt", { email: values.email });

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        console.error("❌ Customer login failed", result.error);
        setErrorMessage("Email atau password tidak valid.");
        return;
      }

      console.log("✅ Customer login successful. Validating session role...");

      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        throw new Error(`Gagal memuat sesi pengguna (${sessionResponse.status}).`);
      }

      const sessionData = await sessionResponse.json();
      const role = sessionData?.user?.role?.toLowerCase();

      if (role !== "customer") {
        console.error("❌ Logged in user is not a customer", { role });
        setErrorMessage("Akun ini tidak memiliki akses sebagai pemesan.");
        return;
      }

      const isSafeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//");
      let target = "/";
      if (isSafeCallback && callbackUrl && callbackUrl !== "/login-customer") {
        target = callbackUrl;
      }

      console.log("🔄 Redirecting customer after login", { target });

      router.push(target);
      router.refresh();
    } catch (error) {
      console.error("❌ Terjadi kesalahan saat login customer", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat melakukan login. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Masuk sebagai Pemesan</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Gunakan email dan password Anda untuk melanjutkan pemesanan kos favorit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contoh@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="Masukkan password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun? {" "}
          <Link href="/register-customer" className="font-medium text-primary hover:text-primary/80">
            Daftar sebagai pemesan
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
