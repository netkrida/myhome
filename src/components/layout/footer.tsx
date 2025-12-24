import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-background to-muted/30 border-t border-border/50">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find and book the perfect kos (boarding house) for your needs.
              Connecting students and professionals with quality accommodation.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:bg-sky-500 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:bg-red-600 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Youtube"
              >
                <Youtube className="h-4 w-4" />
              </a>
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

