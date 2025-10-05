import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { HydrationFix } from "@/components/hydration-fix";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { AuthErrorHandler } from "@/components/auth/auth-error-handler";
import { ConditionalAnalyticsTracker } from "@/components/analytics/analytics-tracker";

export const metadata: Metadata = {
  title: "MultiKost - Find Your Perfect Boarding House",
  description: "Discover comfortable and affordable boarding houses near your campus or workplace. Book with confidence and move in hassle-free.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        style={{ cursor: 'auto' }}
        suppressHydrationWarning={true}
      >
        <SessionProvider>
          <AuthErrorHandler>
            <HydrationFix />
            <ConditionalAnalyticsTracker
              debug={process.env.NODE_ENV === 'development'}
              enableInDevelopment={true}
            />
            {children}
            <Toaster />
          </AuthErrorHandler>
        </SessionProvider>
      </body>
    </html>
  );
}
