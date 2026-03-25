import type { LucideIcon } from "lucide-react"
import { BarChart3, Home, Link2, Package, Palette, Plus, Settings, Settings2, Users } from "lucide-react"

import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export type DashboardNavItem = {
  title: string
  mobileLabel: string
  href: string
  icon: LucideIcon
  requiresPremium?: boolean
  panel?: "links" | "products" | "design" | "theme"
  isSubItem?: boolean
  showInMobile?: boolean
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { title: "Home", mobileLabel: "Home", href: "/dashboard", icon: Home },
  {
    title: "My Links",
    mobileLabel: "Links",
    href: "/dashboard?panel=links",
    icon: Link2,
    requiresPremium: true,
    panel: "links",
    isSubItem: true,
    showInMobile: false,
  },
  {
    title: "Settings",
    mobileLabel: "Settings",
    href: "/dashboard?panel=design",
    icon: Settings2,
    panel: "design",
    isSubItem: true,
    showInMobile: false,
  },
  {
    title: "Theme & Design",
    mobileLabel: "Theme & Design",
    href: "/dashboard?panel=theme",
    icon: Palette,
    panel: "theme",
    isSubItem: true,
    showInMobile: false,
  },
  {
    title: "Add Products",
    mobileLabel: "Products",
    href: "/dashboard?panel=products",
    icon: Plus,
    requiresPremium: true,
    panel: "products",
    isSubItem: true,
    showInMobile: false,
  },
  { title: "My Products", mobileLabel: "Products", href: "/dashboard/products", icon: Package, requiresPremium: true },
  { title: "Audience", mobileLabel: "Audience", href: "/dashboard/audience", icon: Users },
  { title: "Analytics", mobileLabel: "Stats", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Account", mobileLabel: "Account", href: "/dashboard/account", icon: Settings },
]

export function resolveDashboardNavItems(canUseShopFeatures: boolean) {
  return DASHBOARD_NAV_ITEMS.map((item) => ({
    ...item,
    targetHref: item.requiresPremium && !canUseShopFeatures ? getSubscriptionRedirectPath(item.href) : item.href,
  }))
}

export function isDashboardNavItemActive(
  pathname: string,
  item: DashboardNavItem,
  searchParams?: URLSearchParams | null,
) {
  if (item.panel) {
    return pathname === "/dashboard" && searchParams?.get("panel") === item.panel
  }

  if (item.href === "/dashboard") {
    const panel = searchParams?.get("panel")
    return pathname === item.href && (!panel || panel === "products")
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
