import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { CustomerAPI } from "@/server/api/customer.api";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { ProfileTabsClient } from "@/components/customer/profile-tabs-client";

export default async function CustomerProfilePage() {
	noStore();

	const result = await CustomerAPI.getProfile();

	// fix: discriminated union Result type - guard before accessing error
	if (!result.success) {
		console.error("Failed to load customer profile", result.error);
		notFound();
	}

	const profile = result.data;

	return (
		<CustomerLayout>
			<div className="space-y-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profil Saya</h1>
					<p className="text-sm text-muted-foreground">
						Kelola informasi personal dan pengaturan akun Anda
					</p>
				</div>

				<ProfileTabsClient profile={profile} />
			</div>
		</CustomerLayout>
	);
}

