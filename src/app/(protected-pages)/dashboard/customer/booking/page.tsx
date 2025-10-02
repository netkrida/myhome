import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { format, isAfter, parseISO } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CustomerAPI } from "@/server/api/customer.api";

function safeParseDate(value?: string | Date | null) {
	if (!value) return null;
	if (value instanceof Date) {
		return value;
	}
	try {
		return parseISO(value);
	} catch (error) {
		console.error("Failed to parse booking date", { value, error });
		return null;
	}
}

function formatDate(value?: string | Date | null, pattern = "d MMMM yyyy") {
	const parsed = safeParseDate(value);
	if (!parsed) return "-";
	return format(parsed, pattern, { locale: indonesianLocale });
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
});

export default async function CustomerBookingPage() {
	noStore();

	const result = await CustomerAPI.getProfile();

	if (!result.success || !result.data) {
		console.error("Failed to load booking data", result.error);
		notFound();
	}

	const bookings = result.data.recentBookings;
	const hasBookings = bookings.length > 0;

	const upcomingBookings = bookings.filter((booking) => {
		const checkInDate = safeParseDate(booking.checkInDate ?? undefined);
		return checkInDate ? isAfter(checkInDate, new Date()) : false;
	});

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Booking Saya</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Pantau pemesanan terbaru, status check-in, dan pembayaran kamar kos kamu.
				</p>
			</div>

			<Card>
				<CardHeader className="pb-4">
					<CardTitle>Ringkasan Booking</CardTitle>
					<CardDescription>
						{hasBookings
							? "Semua pemesanan terbaru dalam 90 hari terakhir."
							: "Belum ada riwayat booking. Mulai jelajahi kos yang kamu inginkan."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{!hasBookings ? (
						<div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
							Belum ada pemesanan yang tercatat. Pilih kos favoritmu di katalog publik untuk melakukan
							booking pertama.
						</div>
					) : (
						<div className="space-y-6">
							{upcomingBookings.length > 0 && (
								<div className="space-y-3">
									<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
										Yang akan datang
									</h2>
									<div className="grid gap-4 lg:grid-cols-2">
										{upcomingBookings.map((booking) => (
											<div key={booking.id} className="rounded-lg border p-4 shadow-sm">
												<div className="flex items-start justify-between gap-3">
													<div>
														<p className="text-sm font-semibold text-foreground">{booking.propertyName}</p>
														<p className="text-xs text-muted-foreground">{booking.roomType ?? "Tipe kamar belum diisi"}</p>
													</div>
													<Badge variant="secondary" className="uppercase">
														{booking.status.toLowerCase().replace(/_/g, " ")}
													</Badge>
												</div>
												<Separator className="my-3" />
												<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
													<p>
														<span className="font-medium text-foreground">Check-in:</span> {formatDate(booking.checkInDate)}
													</p>
													<p>
														<span className="font-medium text-foreground">Dibuat:</span> {formatDate(booking.createdAt, "d MMM yyyy HH:mm")}
													</p>
													<p>
														<span className="font-medium text-foreground">Kode Booking:</span> {booking.bookingCode}
													</p>
													<p>
														<span className="font-medium text-foreground">Total Pembayaran:</span>
														<span className="ml-2 text-foreground">
															{currencyFormatter.format(booking.totalAmount)}
														</span>
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="space-y-3">
								<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
									Riwayat terbaru
								</h2>
								<div className="overflow-x-auto">
									<table className="min-w-full text-left text-sm">
										<thead className="text-xs uppercase text-muted-foreground">
											<tr className="border-b">
												<th className="py-2 pr-4 font-medium">Kode</th>
												<th className="py-2 pr-4 font-medium">Properti</th>
												<th className="py-2 pr-4 font-medium">Check-in</th>
												<th className="py-2 pr-4 font-medium">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{bookings.map((booking) => (
												<tr key={booking.id} className="hover:bg-muted/40">
													<td className="py-3 pr-4 font-medium text-foreground">{booking.bookingCode}</td>
													<td className="py-3 pr-4 text-foreground">{booking.propertyName ?? "-"}</td>
													<td className="py-3 pr-4 text-foreground">{formatDate(booking.checkInDate)}</td>
													<td className="py-3 pr-4">
														<Badge variant="outline" className="uppercase">
															{booking.status.toLowerCase().replace(/_/g, " ")}
														</Badge>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
