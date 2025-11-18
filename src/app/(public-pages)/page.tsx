import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PropertyListingSection } from "@/components/public/property-listing-section";
import { AdvertisementCarousel } from "@/components/public/advertisement-carousel";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        {/* Advertisement Carousel */}
        <section className="w-full bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <AdvertisementCarousel />
          </div>
        </section>

        {/* Property Listings */}
        <PropertyListingSection />
      </main>
      <PublicFooter />
    </div>
  );
}
