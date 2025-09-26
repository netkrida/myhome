"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, User, Heart, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function PublicHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigationItems = [
    // { label: "Pesawat", href: "/flights", badge: null },
    // { label: "Hotel", href: "/hotels", badge: "-40%" },
    // { label: "Vila & Apt", href: "/villas", badge: null },
    // { label: "To Do", href: "/activities", badge: null },
    // { label: "Kereta", href: "/trains", badge: null },
    // { label: "Lainnya", href: "/more", badge: null, hasDropdown: true },
  ];

  const userMenuItems = [
    { label: "Your Orders", href: "/orders" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
                M
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">MultiKost</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <div key={item.label} className="relative">
                {item.hasDropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1">
                        <span>{item.label}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Link href="/search">Cari Kos</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/about">Tentang Kami</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/contact">Kontak</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors text-sm"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* User Menu - Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              {userMenuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                3
              </Badge>
            </Button>

            {/* Favorites */}
            <Button variant="ghost" size="sm" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-xs" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" asChild>
                <Link href="/register">Daftar</Link>
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-6 mt-6">
                  {/* Mobile Auth */}
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" asChild>
                      <Link href="/login">Masuk</Link>
                    </Button>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/register">Daftar</Link>
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-4">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center justify-between py-2 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile User Menu */}
                  <div className="border-t pt-4">
                    <div className="flex flex-col space-y-3">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="lg:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kos impianmu..."
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
