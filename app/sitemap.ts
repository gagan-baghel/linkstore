import type { MetadataRoute } from "next"

// ponytail: static pages only — enumerating published stores needs a new
// Convex query; add one (e.g. stores:listPublicUsernames) and map it here
// when store pages should be crawlable from the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
  return ["/", "/contact", "/terms", "/privacy", "/refunds"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }))
}
