import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CustomerAPI } from "@/server/api/customer.api";
import type { CustomerProfileDetail } from "@/server/types/customer";

function formatDate(date?: Date | string | null, pattern = "d MMMM yyyy") {
	if (!date) return "-";
	const parsed = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(parsed.getTime())) return "-";
	return format(parsed, pattern, { locale: indonesianLocale });
}

function buildAddress(profile: CustomerProfileDetail) {
	const parts = [
		profile.address.streetAddress,
		profile.address.districtName,
		profile.address.regencyName,
		profile.address.provinceName,
	].filter(Boolean);

	return parts.length ? parts.join(", ") : "Belum diisi";
}

export default async function CustomerProfilePage() {
	noStore();

	const result = await CustomerAPI.getProfile();

	if (!result.success || !result.data) {
		console.error("Failed to load customer profile", result.error);
		notFound();
	}

	const profile = result.data;

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Profil Saya</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Kelola informasi personal, kontak darurat, dan pantau riwayat pemesanan terbaru kamu.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="pb-4">
						<CardTitle>Informasi Pribadi</CardTitle>
						<CardDescription>
							Detail akun utama yang digunakan saat melakukan pemesanan.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<p className="text-sm text-muted-foreground">Nama Lengkap</p>
								<p className="text-base font-medium text-foreground">{profile.name ?? "Belum diisi"}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Email</p>
								<p className="text-base font-medium text-foreground">{profile.email ?? "Belum diisi"}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Nomor Telepon</p>
								<p className="text-base font-medium text-foreground">{profile.phoneNumber ?? "Belum diisi"}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Bergabung Sejak</p>
								<p className="text-base font-medium text-foreground">{formatDate(profile.memberSince)}</p>
							</div>
						</div>

						<Separator />

						<div className="space-y-3">
							<p className="text-sm text-muted-foreground">Alamat Lengkap</p>
							<p className="text-base font-medium text-foreground leading-relaxed">
								{buildAddress(profile)}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-4">
						<CardTitle>Status & Statistik</CardTitle>
						<CardDescription>Ringkasan aktivitas terbaru kamu.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{profile.profile?.status && (
							<div>
								<p className="text-sm text-muted-foreground">Status Customer</p>
								<Badge variant="secondary" className="mt-1 uppercase">
									{profile.profile.status.toLowerCase().replace(/_/g, " ")}
								</Badge>
							</div>
						)}
						<div className="grid grid-cols-3 gap-3">
							<div className="rounded-lg border p-3 text-center">
								<p className="text-2xl font-semibold text-foreground">{profile.stats.totalBookings}</p>
								<p className="text-xs text-muted-foreground uppercase tracking-wide">Total Booking</p>
							</div>
							<div className="rounded-lg border p-3 text-center">
								<p className="text-2xl font-semibold text-foreground">{profile.stats.activeBookings}</p>
								<p className="text-xs text-muted-foreground uppercase tracking-wide">Aktif</p>
							</div>
							<div className="rounded-lg border p-3 text-center">
								<p className="text-2xl font-semibold text-foreground">{profile.stats.pendingPayments}</p>
								<p className="text-xs text-muted-foreground uppercase tracking-wide">Menunggu</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="pb-4">
						<CardTitle>Kontak Darurat</CardTitle>
						<CardDescription>
							Informasi kontak yang akan dihubungi ketika terjadi keadaan darurat.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Kontak</p>
							<p className="text-base font-medium text-foreground">
								{profile.profile?.emergencyContact ?? "Belum diisi"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Nomor Telepon</p>
							<p className="text-base font-medium text-foreground">
								{profile.profile?.emergencyPhone ?? "Belum diisi"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Tanggal Lahir</p>
							<p className="text-base font-medium text-foreground">
								{formatDate(profile.profile?.dateOfBirth)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Jenis Kelamin</p>
							<p className="text-base font-medium text-foreground">
								{profile.profile?.gender ?? "Belum diisi"}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-4">
						<CardTitle>Informasi Tambahan</CardTitle>
						<CardDescription>Detail pendidikan atau pekerjaan kamu.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground">Institusi / Perusahaan</p>
							<p className="text-base font-medium text-foreground">
								{profile.profile?.institutionName ?? "Belum diisi"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Peran Akun</p>
							<Badge variant="outline" className="mt-1 uppercase">
								{profile.role.toLowerCase()}
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="pb-4">
					<CardTitle>Booking Terbaru</CardTitle>
					<CardDescription>Lihat lima booking terakhir yang kamu lakukan.</CardDescription>
				</CardHeader>
				<CardContent>
					{profile.recentBookings.length === 0 ? (
						<p className="text-sm text-muted-foreground">Belum ada riwayat booking.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-left text-sm">
								<thead className="text-xs uppercase text-muted-foreground">
									<tr className="border-b">
										<th className="py-2 pr-4 font-medium">Kode Booking</th>
										<th className="py-2 pr-4 font-medium">Properti</th>
										<th className="py-2 pr-4 font-medium">Tipe Kamar</th>
										<th className="py-2 pr-4 font-medium">Check-in</th>
										<th className="py-2 pr-4 font-medium">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{profile.recentBookings.map((booking) => (
										<tr key={booking.id} className="hover:bg-muted/40">
											<td className="py-3 pr-4 font-medium text-foreground">{booking.bookingCode}</td>
											<td className="py-3 pr-4 text-foreground">{booking.propertyName ?? "-"}</td>
											<td className="py-3 pr-4 text-foreground">{booking.roomType ?? "-"}</td>
											<td className="py-3 pr-4 text-foreground">{formatDate(booking.checkInDate)}</td>
											<td className="py-3 pr-4">
												<Badge variant="secondary" className="uppercase">
													{booking.status.toLowerCase().replace(/_/g, " ")}
												</Badge>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
