"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import {
  IconDashboard,
  IconUsers,
  IconBuilding,
  IconBed,
  IconCalendar,
  IconSettings,
  IconChartBar,
  IconFileText,
  IconUserCheck,
  IconClipboardList,
  IconHome,
  IconHeart,
  IconHistory,
  IconBell,
  IconWallet,
  IconCreditCard,
  IconReport,
  IconUpload,
  IconActivity,
  IconAd,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface DashboardSidebarProps {
  variant?: "sidebar" | "floating" | "inset"
}

export function DashboardSidebar({ variant = "sidebar" }: DashboardSidebarProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  // Get navigation items based on user role - memoized to prevent infinite re-renders
  const navItems = React.useMemo(() => {
    switch (userRole) {
      case "SUPERADMIN":
        return [
          {
            title: "Dashboard",
            url: "/dashboard/superadmin",
            icon: IconDashboard,
          },
          {
            title: "User Management",
            url: "/dashboard/superadmin/users",
            icon: IconUsers,
          },
          {
            title: "Properties",
            url: "/dashboard/superadmin/properties",
            icon: IconBuilding,
          },
          {
            title: "Transaction",
            url: "/dashboard/superadmin/transactions",
            icon: IconChartBar,
          },
          {
            title: "Iklan",
            url: "/dashboard/superadmin/iklan",
            icon: IconAd,
          },
          {
            title: "Submission",
            url: "/dashboard/superadmin/submission",
            icon: IconUpload,
          },
          {
            title: "Reports",
            url: "/dashboard/superadmin/reports",
            icon: IconFileText,
          },
          {
            title: "Konten Website",
            url: "/dashboard/superadmin/site-content",
            icon: IconClipboardList,
          },
          {
            title: "Settings",
            url: "/dashboard/superadmin/settings",
            icon: IconSettings,
          },
        ]

      case "ADMINKOS":
        return [
          {
            title: "Dashboard",
            url: "/dashboard/adminkos",
            icon: IconDashboard,
          },
          {
            title: "My Properties",
            url: "/dashboard/adminkos/properties",
            icon: IconBuilding,
          },
          {
            title: "Rooms",
            url: "/dashboard/adminkos/rooms",
            icon: IconBed,
          },
          {
            title: "Bookings",
            url: "/dashboard/adminkos/bookings",
            icon: IconCalendar,
          },
          {
            title: "Iklan",
            url: "/dashboard/adminkos/iklan",
            icon: IconAd,
          },
          {
            title: "Receptionists",
            url: "/dashboard/adminkos/receptionist",
            icon: IconUserCheck,
          },
          {
            title: "Transaction",
            url: "/dashboard/adminkos/transaction",
            icon: IconWallet,
          },
          {
            title: "Withdraw",
            url: "/dashboard/adminkos/withdraw",
            icon: IconWallet,
          },
          {
            title: "Settings",
            url: "/dashboard/adminkos/settings",
            icon: IconSettings,
          },
        ]

      case "RECEPTIONIST":
        return [
          {
            title: "Dashboard",
            url: "/dashboard/receptionist",
            icon: IconDashboard,
          },
          {
            title: "Bookings",
            url: "/dashboard/receptionist/bookings",
            icon: IconCalendar,
            items: [
              {
                title: "All Bookings",
                url: "/dashboard/receptionist/bookings",
              },
              {
                title: "Check-in",
                url: "/dashboard/receptionist/bookings/checkin",
              },
              {
                title: "Check-out",
                url: "/dashboard/receptionist/bookings/checkout",
              },
              {
                title: "Direct Booking",
                url: "/dashboard/receptionist/bookings/direct",
              },
            ],
          },
          {
            title: "Room Status",
            url: "/dashboard/receptionist/rooms",
            icon: IconBed,
          },
          {
            title: "Reports",
            url: "/dashboard/receptionist/reports",
            icon: IconFileText,
          },
        ]

      case "CUSTOMER":
        return [
          {
            title: "Dashboard",
            url: "/dashboard/customer",
            icon: IconDashboard,
          },
          {
            title: "My Bookings",
            url: "/dashboard/customer/bookings",
            icon: IconCalendar,
            items: [
              {
                title: "Active Bookings",
                url: "/dashboard/customer/bookings/active",
              },
              {
                title: "Booking History",
                url: "/dashboard/customer/bookings/history",
              },
            ],
          },
          {
            title: "Favorites",
            url: "/dashboard/customer/favorites",
            icon: IconHeart,
          },
          {
            title: "Browse Properties",
            url: "/",
            icon: IconHome,
          },
          {
            title: "Notifications",
            url: "/dashboard/customer/notifications",
            icon: IconBell,
          },
          {
            title: "Profile",
            url: "/dashboard/customer/profile",
            icon: IconSettings,
          },
        ]

      default:
        return []
    }
  }, [userRole])

  return (
    <Sidebar variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-2 justify-center">
                <div className="relative h-8 w-auto flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="MyHome Logo"
                    width={120}
                    height={32}
                    className="object-contain"
                    priority
                  />
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
