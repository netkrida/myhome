"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
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
  IconActivity,
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
            items: [
              {
                title: "All Users",
                url: "/dashboard/superadmin/users",
              },
              {
                title: "Admin Kos",
                url: "/dashboard/superadmin/users/adminkos",
              },
              {
                title: "Customers",
                url: "/dashboard/superadmin/users/customers",
              },
            ],
          },
          {
            title: "Properties",
            url: "/dashboard/superadmin/properties",
            icon: IconBuilding,
          },
          {
            title: "Analytics",
            url: "/dashboard/superadmin/analytics",
            icon: IconChartBar,
          },
          {
            title: "Reports",
            url: "/dashboard/superadmin/reports",
            icon: IconFileText,
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
            items: [
              {
                title: "All Properties",
                url: "/dashboard/adminkos/properties",
              },
              {
                title: "Add Property",
                url: "/dashboard/adminkos/properties/add",
              },
            ],
          },
          {
            title: "Rooms",
            url: "/dashboard/adminkos/rooms",
            icon: IconBed,
            items: [
              {
                title: "All Rooms",
                url: "/dashboard/adminkos/rooms",
              },
              {
                title: "Add Room",
                url: "/dashboard/adminkos/rooms/add",
              },
            ],
          },
          {
            title: "Bookings",
            url: "/dashboard/adminkos/bookings",
            icon: IconCalendar,
          },
          {
            title: "Receptionists",
            url: "/dashboard/adminkos/receptionists",
            icon: IconUserCheck,
          },
          {
            title: "Analytics",
            url: "/dashboard/adminkos/analytics",
            icon: IconChartBar,
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
            title: "Validation",
            url: "/dashboard/receptionist/validation",
            icon: IconClipboardList,
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
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconBuilding className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">MultiKost</span>
                  <span className="truncate text-xs">
                    {userRole?.toLowerCase().replace("_", " ")} Dashboard
                  </span>
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
