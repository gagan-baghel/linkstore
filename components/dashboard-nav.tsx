"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart, Home, Package, Palette, Settings, Store } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Products", href: "/dashboard/products", icon: Package, requiresPremium: true },
  { title: "Store Settings", href: "/dashboard/store", icon: Store },
  { title: "Store Theme", href: "/dashboard/store-theme", icon: Palette, requiresPremium: true },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart },
  { title: "Account", href: "/dashboard/account", icon: Settings },
]

export function DashboardNav({ canUseShopFeatures }: { canUseShopFeatures: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="grid gap-0.5">
      {navItems.map((item) => {
        const targetHref =
          item.requiresPremium && !canUseShopFeatures ? getSubscriptionRedirectPath(item.href) : item.href
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
            <Link href={targetHref} scroll={false} aria-current={isActive ? "page" : undefined}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
