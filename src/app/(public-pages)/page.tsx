import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBuilding, IconMapPin, IconStar, IconUsers } from "@tabler/icons-react"
import { HeroSearch, Testimonials } from "@/components/homepage"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <PublicHeader />

      {/* Hero Search Section */}
      <HeroSearch />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose MultiKost?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <IconMapPin className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Prime Locations</CardTitle>
              <CardDescription>
                Find boarding houses in strategic locations near universities, offices, and public transportation.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <IconStar className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Quality Assured</CardTitle>
              <CardDescription>
                All properties are verified and rated by our community to ensure you get the best experience.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <IconUsers className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Trusted Community</CardTitle>
              <CardDescription>
                Join thousands of satisfied tenants who found their perfect home through MultiKost.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1,000+</div>
              <div className="text-blue-100">Properties Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Happy Tenants</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-blue-100">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8/5</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to Find Your New Home?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join MultiKost today and discover amazing boarding houses in your area.
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
