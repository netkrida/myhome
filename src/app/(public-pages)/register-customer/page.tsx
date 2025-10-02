import Link from "next/link";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { CustomerRegisterForm } from "@/components/auth/customer-register-form";

export default function RegisterCustomerPage() {
	return (
		<div className="min-h-screen flex flex-col">
			<PublicHeader />

			<main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<CustomerRegisterForm />

					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Sudah punya akun pemesan?{" "}
							<Link
								href="/login-customer"
								className="font-medium text-primary hover:text-primary/80 transition-colors"
							>
								Masuk di sini
							</Link>
						</p>
					</div>

					<div className="text-center text-sm text-muted-foreground">
						<p>
							Ingin mendaftar sebagai AdminKos?{" "}
							<Link
								href="/register"
								className="font-medium text-primary hover:text-primary/80 transition-colors"
							>
								Daftar AdminKos
							</Link>
						</p>
					</div>

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
