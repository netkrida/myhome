import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconMapPin, IconStar, IconUsers } from "@tabler/icons-react"
import { HeroSearch, PublicPropertiesSection, PublicPropertiesSectionSkeleton, Testimonials } from "@/components/public"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <PublicHeader />

      {/* Hero Search Section */}
      <HeroSearch />

      {/* Featured Properties */}
      <Suspense fallback={<PublicPropertiesSectionSkeleton />}>
        <PublicPropertiesSection />
      </Suspense>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Why Choose myhome?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <IconMapPin className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Prime Locations</CardTitle>
              <CardDescription>
                Find boarding houses in strategic locations near universities, offices, and public transportation.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <IconStar className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Quality Assured</CardTitle>
              <CardDescription>
                All properties are verified and rated by our community to ensure you get the best experience.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <IconUsers className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Trusted Community</CardTitle>
              <CardDescription>
                Join thousands of satisfied tenants who found their perfect home through myhome.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="mb-2 text-4xl font-bold">1,000+</div>
              <div className="text-primary-foreground/80">Properties Listed</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold">50,000+</div>
              <div className="text-primary-foreground/80">Happy Tenants</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold">25+</div>
              <div className="text-primary-foreground/80">Cities Covered</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold">4.8/5</div>
              <div className="text-primary-foreground/80">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="mb-6 text-3xl font-bold">
          Ready to Find Your New Home?
        </h2>
        <p className="mb-8 text-xl text-muted-foreground">
          Join myhome today and discover amazing boarding houses in your area.
        </p>
        <Button size="lg" asChild>
          <Link href="/login">Get Started</Link>
        </Button>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  )
}
