import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PropertyListingSection } from "@/components/public/property-listing-section";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        <PropertyListingSection />
      </main>
      <PublicFooter />
    </div>
  );
}
