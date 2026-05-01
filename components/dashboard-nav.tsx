"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { isDashboardNavItemActive, resolveDashboardNavItems } from "@/components/dashboard-nav-items"

export function DashboardNav({ canUseShopFeatures }: { canUseShopFeatures: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const resolvedNavItems = useMemo(
    () => resolveDashboardNavItems(canUseShopFeatures),
    [canUseShopFeatures],
  )
  const [isExpandedOverride, setIsExpandedOverride] = useState(false)

  useEffect(() => {
    for (const item of resolvedNavItems) {
      if (item.targetHref !== pathname) {
        router.prefetch(item.targetHref)
      }
    }
  }, [pathname, resolvedNavItems, router])

  const mainItems = resolvedNavItems.filter((item) => !item.isSubItem)
  const subItems = resolvedNavItems.filter((item) => item.isSubItem)
  const hasActiveSubItem = subItems.some((item) => isDashboardNavItemActive(pathname, item, searchParams))
  const isExpanded = hasActiveSubItem || isExpandedOverride

  return (
    <nav className="grid gap-1.5">
      {mainItems.map((item) => {
        const targetHref = item.targetHref
        const isActive = isDashboardNavItemActive(pathname, item, searchParams)
        const isHome = item.href === "/dashboard"

        return (
          <div key={item.href} className="grid gap-1">
            <div
              className={cn(
                "group relative flex w-full items-center justify-between rounded-xl border border-transparent px-3 transition-colors",
                "h-11",
                isActive &&
                  "border-sky-100/70 bg-sky-50 text-slate-900 after:absolute after:left-2 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-sky-400",
                !isActive && "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Link
                href={targetHref}
                scroll={false}
                prefetch
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={() => router.prefetch(targetHref)}
                onFocus={() => router.prefetch(targetHref)}
                className="flex w-full items-center gap-3"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors",
                    isActive && "bg-white text-sky-600 shadow-[0_6px_12px_rgba(15,23,42,0.08)] ring-1 ring-sky-100/80",
                    !isActive && "group-hover:bg-white group-hover:text-slate-900",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="truncate text-sm font-medium">{item.title}</span>
              </Link>
              {isHome && (
                <button
                  type="button"
                  onClick={() => setIsExpandedOverride((prev) => !prev)}
                  aria-expanded={isExpanded}
                  className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                >
                  <ChevronDown className={cn("h-4 w-4 transition", isExpanded && "rotate-180")} />
                </button>
              )}
            </div>

            {isHome && isExpanded && subItems.length > 0 && (
              <div className="grid gap-1 pl-6">
                {subItems.map((subItem) => {
                  const subHref = subItem.targetHref
                  const subActive = isDashboardNavItemActive(pathname, subItem, searchParams)

                  return (
                    <Button
                      key={subItem.href}
                      asChild
                      variant={subActive ? "secondary" : "ghost"}
                      className={cn(
                        "group relative h-10 w-full justify-start rounded-lg border border-transparent px-2 text-[12px] font-medium shadow-none transition-colors",
                        subActive &&
                          "border-sky-100/70 bg-sky-50 text-slate-900 after:absolute after:left-1 after:top-1/2 after:h-4 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-sky-400",
                        !subActive && "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <Link
                        href={subHref}
                        scroll={false}
                        prefetch
                        aria-current={subActive ? "page" : undefined}
                        onMouseEnter={() => router.prefetch(subHref)}
                        onFocus={() => router.prefetch(subHref)}
                        className="relative flex w-full items-center gap-3"
                      >
                        <span className="absolute -left-4 top-1/2 h-[1px] w-3 -translate-y-1/2 bg-slate-200" />
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors",
                            subActive &&
                              "bg-white text-sky-600 shadow-[0_6px_12px_rgba(15,23,42,0.08)] ring-1 ring-sky-100/80",
                            !subActive && "group-hover:bg-white group-hover:text-slate-900",
                          )}
                        >
                          <subItem.icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{subItem.title}</span>
                      </Link>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
