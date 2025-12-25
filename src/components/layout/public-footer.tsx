"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, ArrowRight, Building2, TrendingUp, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicFooter() {
  return (
    <footer className="relative bg-gradient-to-b from-background to-muted/30 text-foreground border-t border-border/50">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Partner CTA Section */}
        <div className="relative mb-12 lg:mb-16 overflow-hidden rounded-3xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-violet-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 backdrop-blur-[1px]" />

          {/* Decorative shapes */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl" />

          <div className="relative p-8 sm:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Content */}
              <div className="space-y-4 flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">

                  <span className="text-sm font-medium text-white">Bergabung Sekarang!</span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Berminat Menjadi Mitra?
                </h3>
                <p className="text-white/90 text-base sm:text-lg max-w-xl leading-relaxed">
                  Daftarkan kos Anda dan jangkau ribuan pencari kos di seluruh Indonesia.
                  Kelola properti dengan mudah melalui dashboard kami.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Kelola Properti</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Tingkatkan Okupansi</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Aman & Terpercaya</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col items-center lg:items-end gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="group h-14 px-8 text-lg font-semibold rounded-full bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:shadow-2xl hover:shadow-white/25 hover:scale-105"
                  >
                    <span>Daftar Sebagai Mitra</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-5">
            <Link href="/" className="inline-block group">
              <Image
                src="/logo.png"
                alt="MyHome"
                width={160}
                height={48}
                className="h-9 w-auto sm:h-10 transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Platform terpercaya untuk menemukan hunian kos impianmu dengan mudah dan aman di seluruh Indonesia.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50 text-muted-foreground hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50 text-muted-foreground hover:bg-sky-500 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50 text-muted-foreground hover:bg-red-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Youtube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Layanan Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Layanan</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/cari-kos" className="group flex items-center text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  <span>Cari Kos</span>
                </Link>
              </li>
              <li>
                <Link href="/register" className="group flex items-center text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  <span>Daftar Properti</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="group flex items-center text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  <span>Tentang Kami</span>
                </Link>
              </li>

            </ul>
          </div>

          {/* Bantuan Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Bantuan</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="group flex items-center text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  <span>Syarat & Ketentuan</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="group flex items-center text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  <span>Kebijakan Privasi</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Kontak Kami</h3>
            <ul className="space-y-4">
              <li>
                <a href="mailto:info@myhome.co.id" className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="pt-1">info@myhome.co.id</span>
                </a>
              </li>
              <li>
                <a href="tel:+6281169468228" className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="pt-1">08116946828</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="pt-1">Pekanbaru, Indonesia</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © 2025 MyHome. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                Terms
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                Privacy
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
