"use client"

import { usePathname, useSearchParams } from "next/navigation"

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
    prefix: "/dashboard/analytics",
    context: {
      heading: "Analytics",
      text: "Track your affiliate link performance.",
    },
  },
  {
    prefix: "/dashboard/audience",
    context: {
      heading: "Audience",
      text: "Review shopper contacts captured from your storefront.",
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
  const searchParams = useSearchParams()
  const panel = searchParams.get("panel")

  if (pathname === "/dashboard" && panel) {
    const panelContext =
      panel === "links"
        ? {
            heading: "Social Links",
            text: "Manage creator profile links shown on your storefront.",
          }
        : panel === "design"
          ? {
              heading: "Store Design",
              text: "Update your banner, bio, and branding.",
            }
          : panel === "theme"
            ? {
                heading: "Theme & Design",
                text: "Refine colors, visuals, and storefront style.",
              }
          : null

    if (panelContext) {
      return (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold tracking-tight text-black sm:text-sm">{panelContext.heading}</p>
          <p className="truncate text-[10px] text-[#6367FF] sm:text-xs">{panelContext.text}</p>
        </div>
      )
    }
  }

  const matched = CONTEXT_BY_PREFIX.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))

  if (!matched) return null

  return (
    <div className="min-w-0">
      <p className="truncate text-[13px] font-semibold tracking-tight text-black sm:text-sm">{matched.context.heading}</p>
      <p className="truncate text-[10px] text-[#6367FF] sm:text-xs">{matched.context.text}</p>
    </div>
  )
}
