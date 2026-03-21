"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { isDashboardNavItemActive, resolveDashboardNavItems } from "@/components/dashboard-nav-items"

export function DashboardNav({ canUseShopFeatures }: { canUseShopFeatures: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const resolvedNavItems = useMemo(
    () => resolveDashboardNavItems(canUseShopFeatures),
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
    <nav className="grid gap-1">
      {resolvedNavItems.map((item) => {
        const targetHref = item.targetHref
        const isActive = isDashboardNavItemActive(pathname, item.href)

        return (
          <Button
            key={item.href}
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "h-11 w-full justify-start rounded-xl border border-transparent px-3 text-sm shadow-none transition-colors",
              isActive && "border-[#d6e0f2] bg-white font-medium text-slate-900 shadow-[0_8px_18px_rgba(87,107,149,0.08)] hover:bg-white hover:text-slate-900",
              !isActive && "text-slate-600 hover:bg-white/70 hover:text-slate-900",
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
