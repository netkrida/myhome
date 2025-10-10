import { CustomerLayout } from "@/components/layout/customer-layout";
import { CardSkeleton } from "@/components/ui/skeletons";

export default function BookingLoading() {
  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Section skeletons */}
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

