"use client"

import { DashboardSidebar } from "./dashboard-sidebar"

interface DashboardSidebarWrapperProps {
  variant?: "sidebar" | "floating" | "inset"
}

export function DashboardSidebarWrapper({ variant = "sidebar" }: DashboardSidebarWrapperProps) {
  return (
    <DashboardSidebar variant={variant} />
  )
}
