import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PropertyDetailSkeleton } from "@/components/ui/skeletons";

export default function PropertyDetailLoading() {
  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-background">
        <PropertyDetailSkeleton />
      </main>
      <PublicFooter />
    </>
  );
}


