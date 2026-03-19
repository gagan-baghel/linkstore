"use client"

import { usePathname } from "next/navigation"

type TopbarContext = {
  heading: string
  text: string
}

const CONTEXT_BY_PREFIX: Array<{ prefix: string; context: TopbarContext }> = [
  {
    prefix: "/dashboard/products",
    context: {
      heading: "Products",
      text: "Manage your affiliate products.",
    },
  },
  {
    prefix: "/dashboard/store-theme",
    context: {
      heading: "Store Theme",
      text: "Customize colors and style for your public store.",
    },
  },
  {
    prefix: "/dashboard/social-links",
    context: {
      heading: "Social Links",
      text: "Manage creator profile links shown on your storefront.",
    },
  },
  {
    prefix: "/dashboard/store",
    context: {
      heading: "Store Settings",
      text: "Manage your store appearance and information.",
    },
  },
  {
    prefix: "/dashboard/analytics",
    context: {
      heading: "Analytics",
      text: "Track your affiliate link performance.",
    },
  },
  {
    prefix: "/dashboard/account",
    context: {
      heading: "Account",
      text: "Manage your account settings.",
    },
  },
  {
    prefix: "/dashboard",
    context: {
      heading: "Dashboard",
      text: "Store pulse and quick actions.",
    },
  },
]

export function DashboardTopbarContext() {
  const pathname = usePathname()
  const matched = CONTEXT_BY_PREFIX.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))

  if (!matched) return null

  return (
    <div className="min-w-0">
      <p className="truncate text-[13px] font-semibold tracking-tight text-[#162033] sm:text-sm">{matched.context.heading}</p>
      <p className="truncate text-[10px] text-[#5f6b7e] sm:text-xs">{matched.context.text}</p>
    </div>
  )
}
