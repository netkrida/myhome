import { CustomerLayout } from "@/components/layout/customer-layout";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function HistoryTransactionLoading() {
  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>

        {/* Mobile: Card skeletons */}
        <div className="space-y-4 lg:hidden">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Desktop: Table skeleton */}
        <div className="hidden lg:block">
          <TableSkeleton rows={8} columns={6} />
        </div>
      </div>
    </CustomerLayout>
  );
}

