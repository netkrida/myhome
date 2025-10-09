
"use client";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, Search, Heart, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { AuthRoleSelectionDialog } from "@/components/auth/auth-role-selection-dialog";

function getInitials(name?: string | null) {
  if (!name) return "CU";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials.slice(0, 2) || "CU";
}

const customerMenuItems = [
  { label: "Booking", href: "/dashboard/customer/booking" },
  { label: "History Transaksi", href: "/dashboard/customer/history-transaction" },
  { label: "Profil", href: "/dashboard/customer/my-profile" },
  { label: "Pengaturan", href: "/dashboard/customer/settings" },
];

const getRoleMenuItems = (role?: string | null) => {
  if (!role) return [];
  if (role === "CUSTOMER") {
    return customerMenuItems;
  }

  const roleLower = role.toLowerCase();
  return [
    { label: "Dashboard", href: `/dashboard/${roleLower}` },
    { label: "Profil", href: "/profile" },
    { label: "Pengaturan", href: "/settings" },
  ];
};

export function PublicHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const isAuthenticated = !!session?.user;
  const menuItems = getRoleMenuItems(session?.user?.role);

  const navigationItems: Array<{
    label: string;
    href: string;
    badge?: string | null;
    hasDropdown?: boolean;
  }> = [
    // { label: "Pesawat", href: "/flights", badge: null },
    // { label: "Hotel", href: "/hotels", badge: "-40%" },
    // { label: "Vila & Apt", href: "/villas", badge: null },
    // { label: "To Do", href: "/activities", badge: null },
    // { label: "Kereta", href: "/trains", badge: null },
    // { label: "Lainnya", href: "/more", badge: null, hasDropdown: true },
  ];

  return (
    <>
  <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm text-foreground">
  <div className="container mx-auto px-4 sm:px-6">
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="MyHome"
              width={160}
              height={48}
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {navigationItems.map((item) => (
              <div key={item.label} className="relative">
                {item.hasDropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1">
                        <span>{item.label}</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/search">Cari Kos</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/about">Tentang Kami</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/contact">Kontak</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center space-x-1 text-sm text-foreground transition-colors hover:text-primary"
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
          <div className="flex items-center space-x-1.5 sm:space-x-3 lg:space-x-4">
            <AnimatedThemeToggler className="mr-0.5 sm:mr-1.5" />

            {/* Search icon removed as requested */}

            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="relative h-8 w-8">
                  <Bell className="h-3.5 w-3.5" />
                  <Badge className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full p-0 text-[9px]">
                    3
                  </Badge>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8">
                  <Heart className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden md:flex h-9 w-9 items-center justify-center rounded-full p-0"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "Customer"}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session?.user?.image || ""}
                          alt={session?.user?.name || "Customer"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(session?.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">
                          {session?.user?.name || "Customer"}
                        </span>
                        {session?.user?.email && (
                          <span className="text-xs text-muted-foreground">
                            {session?.user?.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {menuItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <LogoutButton variant="dropdown" />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Masuk
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-xs hover:bg-primary/80"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Daftar
                </Button>
              </div>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="h-10 w-10 p-0 flex items-center justify-center border border-border rounded-lg bg-background shadow-sm transition-colors hover:border-primary focus-visible:border-primary focus:outline-none lg:hidden"
                >
                  <span className="flex items-center justify-center w-full h-full">
                    <Menu className="h-5 w-5 text-foreground" style={{zIndex:1}} />
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[82vw] max-w-xs px-0 sm:max-w-sm">
                <SheetHeader className="px-4 pt-6 pb-2">
                  <SheetTitle className="text-base font-semibold">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 px-4 pb-6">
                  {!isAuthenticated ? (
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                      >
                        Masuk
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                      >
                        Daftar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-3 rounded-lg border p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={session?.user?.image || ""}
                            alt={session?.user?.name || "Customer"}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(session?.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {session?.user?.name || "Customer"}
                          </span>
                          {session?.user?.email && (
                            <span className="text-xs text-muted-foreground">
                              {session?.user?.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <nav className="flex flex-col space-y-2">
                        {menuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                        <LogoutButton
                          variant="link"
                          className="text-left text-sm font-medium text-destructive"
                        />
                      </nav>
                    </div>
                  )}

                  <nav className="flex flex-col space-y-3">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center justify-between py-2 text-foreground transition-colors hover:text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
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
    <AuthRoleSelectionDialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </>
  );
}


