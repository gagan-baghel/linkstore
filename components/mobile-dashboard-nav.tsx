"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Ellipsis } from "lucide-react"

import { cn } from "@/lib/utils"
import { isDashboardNavItemActive, resolveDashboardNavItems } from "@/components/dashboard-nav-items"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const MOBILE_OVERFLOW_HREFS = new Set(["/dashboard/audience", "/dashboard/analytics"])

export function MobileDashboardNav({ canUseShopFeatures }: { canUseShopFeatures: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const resolvedItems = useMemo(
    () => resolveDashboardNavItems(canUseShopFeatures),
    [canUseShopFeatures],
  )

  useEffect(() => {
    for (const item of resolvedItems) {
      if (item.targetHref !== pathname) {
        router.prefetch(item.targetHref)
      }
    }
  }, [pathname, resolvedItems, router])

  const mobileItems = useMemo(
    () => resolvedItems.filter((item) => item.showInMobile !== false),
    [resolvedItems],
  )
  const primaryItems = useMemo(
    () => mobileItems.filter((item) => !MOBILE_OVERFLOW_HREFS.has(item.href)),
    [mobileItems],
  )
  const overflowItems = useMemo(
    () => mobileItems.filter((item) => MOBILE_OVERFLOW_HREFS.has(item.href)),
    [mobileItems],
  )
  const isOverflowActive = overflowItems.some((item) => isDashboardNavItemActive(pathname, item, searchParams))

  function navButtonClassName(isActive: boolean) {
    return cn(
      "flex min-h-[3.3rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[9px] font-medium leading-none tracking-tight transition-all",
      isActive
        ? "bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900",
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-3 z-40 mx-auto w-[calc(100%-0.9rem)] max-w-[30rem] rounded-[1.6rem] border border-white/80 bg-white/88 px-1.5 pt-1.5 shadow-[0_20px_60px_rgba(56,76,118,0.16)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {primaryItems.map((item) => {
          const targetHref = item.targetHref
          const isActive = isDashboardNavItemActive(pathname, item, searchParams)
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={targetHref}
                scroll={false}
                prefetch
                onTouchStart={() => router.prefetch(targetHref)}
                onMouseEnter={() => router.prefetch(targetHref)}
                onFocus={() => router.prefetch(targetHref)}
                aria-current={isActive ? "page" : undefined}
                title={item.title}
                className={navButtonClassName(isActive)}
              >
                <Icon className="h-[15px] w-[15px]" />
                <span className="truncate">{item.mobileLabel}</span>
              </Link>
            </li>
          )
        })}
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open more dashboard destinations"
              className={cn("w-full focus-visible:outline-none", navButtonClassName(isOverflowActive))}
            >
              <Ellipsis className="h-[15px] w-[15px]" />
              <span className="truncate">More</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="center"
              sideOffset={10}
              className="w-56 rounded-2xl border border-slate-200/90 bg-white/98 p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl"
            >
              {overflowItems.map((item) => {
                const Icon = item.icon
                const isActive = isDashboardNavItemActive(pathname, item, searchParams)

                return (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className={cn(
                      "rounded-xl px-3 py-3 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900",
                      isActive && "bg-slate-100 text-slate-900",
                    )}
                  >
                    <Link
                      href={item.targetHref}
                      scroll={false}
                      prefetch
                      aria-current={isActive ? "page" : undefined}
                      onMouseEnter={() => router.prefetch(item.targetHref)}
                      onFocus={() => router.prefetch(item.targetHref)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600",
                            isActive && "border-slate-900 bg-slate-900 text-white",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {item.href === "/dashboard/analytics"
                              ? "View performance"
                              : item.href === "/dashboard/audience"
                                ? "Review captured contacts"
                                : "Manage creator links"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
      <div className="pb-[max(env(safe-area-inset-bottom),0.2rem)]" />
    </nav>
  )
}
