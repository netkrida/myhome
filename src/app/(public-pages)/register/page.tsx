import Link from "next/link";
import { AdminKosRegisterForm } from "@/components/auth/adminkos-register-form";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <AdminKosRegisterForm />
          
          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link 
                href="/login" 
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
          
          {/* Back to Home */}
          <div className="text-center">
            <Link 
              href="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
