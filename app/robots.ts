import { getConfiguredAppUrl } from "@/lib/storefront-url"
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = getConfiguredAppUrl().origin
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/onboarding", "/auth/"],
    },
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  }
}
