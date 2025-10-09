import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CustomerAPI } from "@/server/api/customer.api";
import { CustomerLayout } from "@/components/layout/customer-layout";
import type { BookingStatus } from "@prisma/client";

function normalizeDate(value?: Date | string | null, pattern = "d MMM yyyy HH:mm") {
	if (!value) return "-";
	const parsed = value instanceof Date ? value : parseISO(value);
	if (Number.isNaN(parsed.getTime())) return "-";
	return format(parsed, pattern, { locale: indonesianLocale });
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
});

const PENDING_STATUSES: BookingStatus[] = ["UNPAID", "DEPOSIT_PAID", "CONFIRMED"];
const COMPLETED_STATUSES: BookingStatus[] = ["CHECKED_IN", "COMPLETED"];

export default async function CustomerTransactionHistoryPage() {
	noStore();

	const result = await CustomerAPI.getProfile();

	// fix: discriminated union Result type - guard before accessing error
	if (!result.success) {
		console.error("Failed to load transaction history", result.error);
		notFound();
	}

	const bookings = result.data.recentBookings;
	const totalAmount = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
	const pendingCount = bookings.filter((booking) => PENDING_STATUSES.includes(booking.status)).length;
	const completedCount = bookings.filter((booking) => COMPLETED_STATUSES.includes(booking.status)).length;
	const cancelledCount = bookings.length - pendingCount - completedCount;

	return (
		<CustomerLayout>
			<div className="space-y-8">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Riwayat Transaksi</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Lihat ringkasan pembayaran terakhir, status tagihan, dan detail transaksi booking kamu.
					</p>
				</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card>
					<CardHeader className="pb-4">
						<CardTitle>Total Pembayaran</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold text-foreground">{currencyFormatter.format(totalAmount)}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-4">
						<CardTitle>Menunggu Pembayaran</CardTitle>
						<CardDescription>Booking yang perlu segera diselesaikan pembayarannya.</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold text-foreground">{pendingCount}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-4">
						<CardTitle>Transaksi Selesai</CardTitle>
						<CardDescription>Booking yang berhasil diselesaikan dan terkonfirmasi.</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold text-foreground">{completedCount}</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="pb-4">
					<CardTitle>Detail Transaksi</CardTitle>
					<CardDescription>
						Semua booking terbaru beserta nilai transaksi dan status terakhirnya.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{bookings.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Belum ada transaksi yang tercatat. Booking pertama kamu akan muncul di sini.
						</p>
					) : (
						<div className="space-y-6">
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								<div className="rounded-lg border p-4">
									<p className="text-xs text-muted-foreground uppercase tracking-wide">Terakhir diperbarui</p>
									<p className="mt-1 text-sm font-medium text-foreground">
										{normalizeDate(bookings[0]?.createdAt)}
									</p>
								</div>
								<div className="rounded-lg border p-4">
									<p className="text-xs text-muted-foreground uppercase tracking-wide">Pembayaran Pending</p>
									<p className="mt-1 text-sm font-medium text-foreground">{pendingCount} booking</p>
								</div>
								<div className="rounded-lg border p-4">
									<p className="text-xs text-muted-foreground uppercase tracking-wide">Dibatalkan / Expired</p>
									<p className="mt-1 text-sm font-medium text-foreground">{cancelledCount} booking</p>
								</div>
							</div>

							<Separator />

							<div className="overflow-x-auto">
								<table className="min-w-full text-left text-sm">
									<thead className="text-xs uppercase text-muted-foreground">
										<tr className="border-b">
											<th className="py-2 pr-4 font-medium">Kode Booking</th>
											<th className="py-2 pr-4 font-medium">Properti</th>
											<th className="py-2 pr-4 font-medium">Total</th>
											<th className="py-2 pr-4 font-medium">Status</th>
											<th className="py-2 pr-4 font-medium">Dibuat</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{bookings.map((booking) => (
											<tr key={booking.id} className="hover:bg-muted/40">
												<td className="py-3 pr-4 font-medium text-foreground">{booking.bookingCode}</td>
												<td className="py-3 pr-4 text-foreground">{booking.propertyName ?? "-"}</td>
												<td className="py-3 pr-4 text-foreground">
													{currencyFormatter.format(booking.totalAmount)}
												</td>
												<td className="py-3 pr-4">
													<Badge variant="outline" className="uppercase">
														{booking.status.toLowerCase().replace(/_/g, " ")}
													</Badge>
												</td>
												<td className="py-3 pr-4 text-foreground">{normalizeDate(booking.createdAt)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
		</CustomerLayout>
	);
}
