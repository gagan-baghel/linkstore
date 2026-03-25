import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { convexQuery } from "@/lib/convex"
import { extractStoreUsernameFromHostname } from "@/lib/storefront-url"

export const dynamic = "force-dynamic"

export default async function HostStorePage() {
  const requestHeaders = await headers()
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""
  const hostname = hostHeader.split(":")[0] || ""
  const username = extractStoreUsernameFromHostname(hostname)

  if (!username) {
    notFound()
  }

  const publicUser = await convexQuery<{ username: string }, { _id: string; username: string } | null>(
    "users:getPublicByUsername",
    {
      username,
    },
  ).catch(() => null)

  if (!publicUser?._id) {
    notFound()
  }

  redirect(`/${encodeURIComponent(username)}`)
}
