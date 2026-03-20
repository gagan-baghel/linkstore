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
    <nav className="grid gap-0.5">
      {resolvedNavItems.map((item) => {
        const targetHref = item.targetHref
        const isActive = isDashboardNavItemActive(pathname, item.href)

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
