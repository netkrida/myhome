import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CustomerAPI } from "@/server/api/customer.api";

export default async function CustomerSettingsPage() {
	noStore();

	const result = await CustomerAPI.getProfile();

	if (!result.success || !result.data) {
		console.error("Failed to load customer settings", result.error);
		notFound();
	}

	const profile = result.data;

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Pengaturan Akun</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Kelola informasi akun, keamanan, dan preferensi notifikasi kamu di satu tempat.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="pb-4">
						<CardTitle>Informasi Dasar</CardTitle>
						<CardDescription>
							Perbarui data diri agar proses booking dan komunikasi berjalan lancar.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Nama Lengkap</p>
							<p className="text-sm font-medium text-foreground">{profile.name ?? "Belum diisi"}</p>
						</div>
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
							<p className="text-sm font-medium text-foreground">{profile.email ?? "Belum diisi"}</p>
						</div>
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Nomor Telepon</p>
							<p className="text-sm font-medium text-foreground">{profile.phoneNumber ?? "Belum diisi"}</p>
						</div>
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Status Akun</p>
							{profile.profile?.status ? (
								<Badge variant="secondary" className="mt-1 uppercase">
									{profile.profile.status.toLowerCase().replace(/_/g, " ")}
								</Badge>
							) : (
								<p className="text-sm font-medium text-foreground">Belum diisi</p>
							)}
						</div>
					</CardContent>
					<CardFooter className="flex flex-wrap gap-3">
						<Button asChild variant="default" size="sm">
							<Link href="/dashboard/customer/my-profile">Perbarui Profil</Link>
						</Button>
						<Button asChild variant="outline" size="sm">
							<Link href="mailto:support@myhome.com">Hubungi Dukungan</Link>
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader className="pb-4">
						<CardTitle>Keamanan & Masuk</CardTitle>
						<CardDescription>
							Pastikan akun kamu aman dengan mengganti password secara berkala.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-muted-foreground">
						<p>Gunakan kombinasi huruf, angka, dan simbol untuk password yang kuat.</p>
						<p>
							Jika kamu merasa ada aktivitas mencurigakan, segera ubah password atau hubungi tim customer
							support.
						</p>
					</CardContent>
					<CardFooter>
						<Button asChild variant="outline" size="sm">
							<Link href="/forgot-password">Reset Password</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>

			<Card>
				<CardHeader className="pb-4">
					<CardTitle>Preferensi Notifikasi</CardTitle>
					<CardDescription>Pilih cara kami menghubungi kamu untuk update booking penting.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<p className="text-sm font-medium text-foreground">Email</p>
						<p className="text-sm text-muted-foreground">
							Kami akan mengirimkan bukti pembayaran, pengingat check-in, dan update penting lainnya.
						</p>
					</div>
					<Separator />
					<div>
						<p className="text-sm font-medium text-foreground">WhatsApp / SMS</p>
						<p className="text-sm text-muted-foreground">
							Aktifkan nomor telepon kamu agar kami dapat menghubungi jika ada perubahan mendesak.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
