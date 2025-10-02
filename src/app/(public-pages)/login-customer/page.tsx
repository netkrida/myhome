import Link from "next/link";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { CustomerLoginForm } from "@/components/auth/customer-login-form";

type LoginCustomerPageProps = {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveCallbackUrl(raw?: string | string[]) {
	if (!raw) return undefined;
	return Array.isArray(raw) ? raw[0] : raw;
}

export default async function LoginCustomerPage({ searchParams }: LoginCustomerPageProps) {
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const callbackUrl = resolveCallbackUrl(resolvedSearchParams?.callbackUrl);
	return (
		<div className="min-h-screen flex flex-col">
			<PublicHeader />

			<main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<CustomerLoginForm callbackUrl={callbackUrl} />

					<div className="text-center text-sm text-muted-foreground">
						<p>
							Bukan pemesan?{" "}
							<Link
								href="/login"
								className="font-medium text-primary hover:text-primary/80 transition-colors"
							>
								Masuk sebagai AdminKos
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
