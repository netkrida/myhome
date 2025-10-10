import { CustomerLayout } from "@/components/layout/customer-layout";
import { ProfileSkeleton } from "@/components/ui/skeletons";

export default function MyProfileLoading() {
  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-lg bg-muted" />
        </div>

        <ProfileSkeleton />
      </div>
    </CustomerLayout>
  );
}

