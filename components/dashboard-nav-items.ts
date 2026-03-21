import type { LucideIcon } from "lucide-react"
import { BarChart3, Home, Link2, Package, Settings, Store, Users } from "lucide-react"

import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export type DashboardNavItem = {
  title: string
  mobileLabel: string
  href: string
  icon: LucideIcon
  requiresPremium?: boolean
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { title: "Dashboard", mobileLabel: "Home", href: "/dashboard", icon: Home },
  { title: "Products", mobileLabel: "Products", href: "/dashboard/products", icon: Package, requiresPremium: true },
  { title: "Store Settings", mobileLabel: "Store", href: "/dashboard/store", icon: Store },
  { title: "Social Links", mobileLabel: "Social", href: "/dashboard/social-links", icon: Link2, requiresPremium: true },
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

export function isDashboardNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
