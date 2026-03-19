"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Home, Link2, Package, Settings, Store } from "lucide-react"

import { cn } from "@/lib/utils"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/products", label: "Products", icon: Package, requiresPremium: true },
  { href: "/dashboard/store", label: "Store", icon: Store },
  { href: "/dashboard/social-links", label: "Social", icon: Link2, requiresPremium: true },
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
    <nav className="fixed inset-x-0 bottom-3 z-40 mx-auto w-[calc(100%-0.9rem)] max-w-[30rem] rounded-[1.6rem] border border-white/80 bg-white/88 px-1.5 pt-1.5 shadow-[0_20px_60px_rgba(56,76,118,0.16)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-6 gap-1">
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
                  "flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 text-[9px] font-medium tracking-tight transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900",
                )}
              >
                <Icon className="h-[15px] w-[15px]" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="pb-[max(env(safe-area-inset-bottom),0.2rem)]" />
    </nav>
  )
}
