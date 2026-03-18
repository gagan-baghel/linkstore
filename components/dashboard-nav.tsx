"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart, Home, Link2, Package, Palette, Settings, Store } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Products", href: "/dashboard/products", icon: Package, requiresPremium: true },
  { title: "Store Settings", href: "/dashboard/store", icon: Store },
  { title: "Social Links", href: "/dashboard/social-links", icon: Link2, requiresPremium: true },
  { title: "Store Theme", href: "/dashboard/store-theme", icon: Palette, requiresPremium: true },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart },
  { title: "Account", href: "/dashboard/account", icon: Settings },
]

export function DashboardNav({ canUseShopFeatures }: { canUseShopFeatures: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const resolvedNavItems = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        targetHref: item.requiresPremium && !canUseShopFeatures ? getSubscriptionRedirectPath(item.href) : item.href,
      })),
    [canUseShopFeatures],
  )

  useEffect(() => {
    for (const item of resolvedNavItems) {
      if (item.targetHref !== pathname) {
        router.prefetch(item.targetHref)
      }
    }
  }, [pathname, resolvedNavItems, router])

  return (
    <nav className="grid gap-0.5">
      {resolvedNavItems.map((item) => {
        const targetHref = item.targetHref
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Button
            key={item.href}
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "h-10 w-full justify-start rounded-md border border-transparent text-sm shadow-none",
              isActive && "border-slate-200 bg-slate-100 font-medium text-slate-900 hover:bg-slate-100 hover:text-slate-900",
              !isActive && "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Link
              href={targetHref}
              scroll={false}
              prefetch
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => router.prefetch(targetHref)}
              onFocus={() => router.prefetch(targetHref)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
