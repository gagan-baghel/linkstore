"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Home, Package, Settings, Store } from "lucide-react"

import { cn } from "@/lib/utils"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/products", label: "Products", icon: Package, requiresPremium: true },
  { href: "/dashboard/store", label: "Store", icon: Store },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/account", label: "Account", icon: Settings },
]

export function MobileDashboardNav({ canUseShopFeatures }: { canUseShopFeatures: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const resolvedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        targetHref: item.requiresPremium && !canUseShopFeatures ? getSubscriptionRedirectPath(item.href) : item.href,
      })),
    [canUseShopFeatures],
  )

  useEffect(() => {
    for (const item of resolvedItems) {
      if (item.targetHref !== pathname) {
        router.prefetch(item.targetHref)
      }
    }
  }, [pathname, resolvedItems, router])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-1.5 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {resolvedItems.map((item) => {
          const targetHref = item.targetHref
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={targetHref}
                prefetch
                onTouchStart={() => router.prefetch(targetHref)}
                onMouseEnter={() => router.prefetch(targetHref)}
                onFocus={() => router.prefetch(targetHref)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium",
                  isActive ? "bg-slate-100 text-slate-900" : "text-slate-500",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
