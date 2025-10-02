"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, LogIn } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { AuthRoleSelectionDialog } from "@/components/auth/auth-role-selection-dialog";


const getNavigationItems = (isCustomer: boolean) => {
  const baseItems = [
    { name: "Home", href: "/" },
    { name: "Browse Kos", href: "/rooms" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  if (isCustomer) {
    // Add customer-specific navigation items
    return [
      ...baseItems.slice(0, 2), // Home, Browse Kos
      { name: "My Bookings", href: "/bookings/my" },
      { name: "Favorites", href: "/favorites" },
      ...baseItems.slice(2), // About, Contact
    ];
  }

  return baseItems;
};

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: session } = useSession();

  const isCustomer = session?.user?.role === "CUSTOMER";
  const navigationItems = getNavigationItems(isCustomer);

  const getDashboardUrl = (role: string) => {
    // Customers don't have a separate dashboard, they stay on public pages
    if (role === "CUSTOMER") {
      return "/";
    }
    return `/dashboard/${role.toLowerCase()}`;
  };

  return (
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground">
  <div className="container flex h-14 items-center justify-between md:h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="MyHome"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Section */}
  <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          {/* Theme Toggler */}
          <AnimatedThemeToggler className="mr-2" />
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} alt="Avatar" />
                    <AvatarFallback>
                      {session.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {session.user.role !== "CUSTOMER" && (
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardUrl(session.user.role || "customer")}>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {session.user.role === "CUSTOMER" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings/my">My Bookings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites">Favorites</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutButton variant="dropdown" />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => setIsAuthModalOpen(true)}>
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Button>
              <Button onClick={() => setIsAuthModalOpen(true)}>Daftar</Button>
            </div>
          )}
        </div>

  {/* Mobile Menu */}
  <AnimatedThemeToggler className="md:hidden mr-2" />
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="pr-0 w-[85vw] max-w-sm">
            <SheetHeader className="px-4 pt-6 pb-2">
              <SheetTitle className="text-base font-semibold">
                Menu
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-3 px-4 pb-6">
              {/* Mobile Logo */}
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <Image
                  src="/logo.png"
                  alt="MyHome"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>

              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Mobile Auth Section */}
              <div className="flex flex-col space-y-2.5 pt-3 border-t">
                {session?.user ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt="Avatar" />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                    {session.user.role !== "CUSTOMER" && (
                      <Link
                        href={getDashboardUrl(session.user.role || "customer")}
                        className="text-sm font-medium transition-colors hover:text-primary"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    {session.user.role === "CUSTOMER" && (
                      <>
                        <Link
                          href="/bookings/my"
                          className="text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          My Bookings
                        </Link>
                        <Link
                          href="/favorites"
                          className="text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          Favorites
                        </Link>
                      </>
                    )}
                    <Link
                      href="/profile"
                      className="text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <LogoutButton
                      variant="link"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    />
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        setIsOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Masuk
                    </Button>
                    <Button
                      className="justify-start"
                      onClick={() => {
                        setIsOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                    >
                      Daftar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Login Modal */}
      <AuthRoleSelectionDialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>
  );
}

