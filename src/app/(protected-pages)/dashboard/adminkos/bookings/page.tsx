import Link from "next/link";
import { CalendarCheck, CalendarClock, LineChart, Shield } from "lucide-react";
import { requireRole } from "@/server/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const upcomingHighlights = [
	{
		title: "Ringkasan Booking",
		description:
			"Pantau okupansi bulanan, revenue, dan sumber booking dalam satu tampilan real-time.",
		icon: LineChart,
	},
	{
		title: "Automated Check-in",
		description:
			"Workflow check-in/out terintegrasi dengan receptionist dan notifikasi penghuni.",
		icon: CalendarCheck,
	},
	{
		title: "Pengingat Pembayaran",
		description:
			"Pengingat deposit & pelunasan otomatis via email dan WhatsApp template.",
		icon: CalendarClock,
	},
];

const operationalChecklist = [
	"Mapping property -> kamar sudah lengkap",
	"Tambah receptionist untuk delegasi operasional harian",
	"Verifikasi harga & metode pembayaran terbaru",
	"Pastikan template pesan konfirmasi booking sudah diapprove",
];

export default async function AdminKosBookingsPage() {
	await requireRole(["ADMINKOS"]);

	return (
		<DashboardLayout title="Manajemen Booking">
			<div className="px-4 lg:px-6 space-y-8">
				<section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">Booking & Operasional</h1>
						<p className="text-muted-foreground max-w-3xl">
							Monitor aktivitas booking, siapkan proses check-in/out, dan kolaborasi dengan receptionist untuk menjaga pengalaman penghuni tetap prima.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button asChild>
							<Link href="/dashboard/adminkos/rooms">Kelola Ketersediaan Kamar</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/dashboard/adminkos/properties">Lihat Properti Saya</Link>
						</Button>
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-3">
					{upcomingHighlights.map((item) => {
						const Icon = item.icon;
						return (
							<Card key={item.title} className="border-dashed">
								<CardHeader className="space-y-3">
									<Badge variant="secondary" className="w-fit gap-2">
										<Icon className="size-3" />
										Segera Hadir
									</Badge>
									<CardTitle className="text-lg">{item.title}</CardTitle>
									<CardDescription>{item.description}</CardDescription>
								</CardHeader>
							</Card>
						);
					})}
				</section>

				<section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
					<Card>
						<CardHeader>
							<CardTitle>Alur Implementasi Booking</CardTitle>
							<CardDescription>
								Dokumentasi detail dan API booking sudah siap — UI operasional akan dirilis bertahap.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
								<p className="font-medium text-foreground">Developer Notes</p>
								<p className="mt-2">
									Endpoint booking (`/api/bookings`) dan layanan `BookingAPI` di tier server sudah lengkap, termasuk kalkulasi harga, validasi status, dan RBAC. Halaman ini menunggu integrasi komponen dashboard untuk menampilkan data realtime.
								</p>
							</div>
							<div>
								<p className="font-medium mb-3">Checklist Operasional</p>
								<ul className="space-y-2 text-sm text-muted-foreground">
									{operationalChecklist.map((item) => (
										<li key={item} className="flex items-start gap-2">
											<span className="mt-1 size-1.5 rounded-full bg-primary" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card className="border-destructive/40 bg-destructive/5">
						<CardHeader className="space-y-3">
							<Badge variant="destructive" className="w-fit gap-2">
								<Shield className="size-3" />
								Catatan Keamanan
							</Badge>
							<CardTitle className="text-lg">Validasi & Pembatasan Akses</CardTitle>
							<CardDescription>
								Hanya AdminKos & Receptionist yang dapat mengubah status booking. Akses akan otomatis ditolak jika sesi kadaluarsa.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground space-y-3">
							<p>
								Gunakan helper `withAuth` dan `withPermission` ketika menambah action baru pada API booking. Hal ini menjaga log audit dan konsistensi RBAC.
							</p>
							<p>
								Workflow pembayaran Midtrans terhubung ke `BookingRepository.updateStatus`. Pastikan perubahan status selalu melalui service agar sinkron dengan histori pembayaran.
							</p>
						</CardContent>
					</Card>
				</section>
			</div>
		</DashboardLayout>
	);
}
