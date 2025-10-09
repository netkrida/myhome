import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container px-4 py-12 sm:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="MyHome"
                width={32}
                height={32}
                className="h-8 w-auto sm:h-9"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Find and book the perfect kos (boarding house) for your needs. 
              Connecting students and professionals with quality accommodation.
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/rooms" className="text-muted-foreground hover:text-primary">
                  Browse Kos
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-primary">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* For Property Owners */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">For Property Owners</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register/adminkos" className="text-muted-foreground hover:text-primary">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  Property Management
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  Pricing Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  Support Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Info</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Jakarta, Indonesia
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  +62 21 1234 5678
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  info@myhome.co.id
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="text-sm text-muted-foreground">
              © 2025 myhome. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm sm:justify-end">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Terms of Service
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

