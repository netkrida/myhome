import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerAPI } from "@/server/api/customer.api";
import { CustomerLayout } from "@/components/layout/customer-layout";
import type { BookingStatus } from "@prisma/client";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

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
						<EmptyState
							title="Belum ada transaksi"
							description="Booking pertama kamu akan muncul di sini"
							variant="default"
						/>
					) : (
						<>
							{/* Mobile: Card Layout */}
							<div className="space-y-3 md:hidden">
								{bookings.map((booking) => {
									const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
										UNPAID: { label: "Belum Dibayar", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
										DEPOSIT_PAID: { label: "DP Dibayar", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
										CONFIRMED: { label: "Terkonfirmasi", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
										CHECKED_IN: { label: "Check-in", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
										COMPLETED: { label: "Selesai", className: "bg-slate-100 text-slate-700 border-slate-200", icon: CheckCircle2 },
										CANCELLED: { label: "Dibatalkan", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
										EXPIRED: { label: "Kadaluarsa", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
									};
									const config = statusConfig[booking.status] || { label: booking.status, className: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock };
									const Icon = config.icon;

									return (
										<Card key={booking.id} className="overflow-hidden rounded-2xl shadow-sm">
											<CardContent className="p-4">
												<div className="flex items-start justify-between gap-2">
													<div className="flex-1 space-y-2">
														<div>
															<p className="text-xs text-muted-foreground">Kode Booking</p>
															<p className="font-mono text-sm font-bold">{booking.bookingCode}</p>
														</div>
														<div>
															<p className="text-xs text-muted-foreground">Properti</p>
															<p className="text-sm font-medium">{booking.propertyName ?? "-"}</p>
														</div>
														<div>
															<p className="text-xs text-muted-foreground">Tanggal</p>
															<p className="text-sm">{normalizeDate(booking.createdAt, "dd MMM yyyy")}</p>
														</div>
													</div>
													<div className="text-right">
														<Badge className={`mb-2 gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${config.className}`}>
															<Icon className="h-3 w-3" />
															{config.label}
														</Badge>
														<Price amount={booking.totalAmount} className="text-base font-bold" />
													</div>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>

							{/* Desktop: Table Layout */}
							<div className="hidden md:block">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Kode Booking</TableHead>
											<TableHead>Properti</TableHead>
											<TableHead className="text-right">Total</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Tanggal</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{bookings.map((booking) => {
											const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
												UNPAID: { label: "Belum Dibayar", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
												DEPOSIT_PAID: { label: "DP Dibayar", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
												CONFIRMED: { label: "Terkonfirmasi", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
												CHECKED_IN: { label: "Check-in", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
												COMPLETED: { label: "Selesai", className: "bg-slate-100 text-slate-700 border-slate-200", icon: CheckCircle2 },
												CANCELLED: { label: "Dibatalkan", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
												EXPIRED: { label: "Kadaluarsa", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
											};
											const config = statusConfig[booking.status] || { label: booking.status, className: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock };
											const Icon = config.icon;

											return (
												<TableRow key={booking.id}>
													<TableCell className="font-mono font-medium">{booking.bookingCode}</TableCell>
													<TableCell>{booking.propertyName ?? "-"}</TableCell>
													<TableCell className="text-right">
														<Price amount={booking.totalAmount} />
													</TableCell>
													<TableCell>
														<Badge className={`gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${config.className}`}>
															<Icon className="h-3 w-3" />
															{config.label}
														</Badge>
													</TableCell>
													<TableCell>{normalizeDate(booking.createdAt, "dd MMM yyyy")}</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
		</CustomerLayout>
	);
}
