import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { CustomerAPI } from "@/server/api/customer.api";
import { BookingListClient } from "@/components/customer/booking-list-client";
import { CustomerLayout } from "@/components/layout/customer-layout";

export default async function CustomerBookingPage() {
	noStore();

	const result = await CustomerAPI.getProfile();

	// fix: discriminated union Result type - guard before accessing error
	if (!result.success) {
		console.error("Failed to load booking data", result.error);
		notFound();
	}

	const bookings = result.data.recentBookings;

	return (
		<CustomerLayout>
			<BookingListClient bookings={bookings} />
		</CustomerLayout>
	);
}
