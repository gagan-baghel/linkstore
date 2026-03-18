import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { StorefrontClient } from "@/components/storefront-client"
import { convexQuery } from "@/lib/convex"
import { getCachedStoreData } from "@/lib/store-cache"
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

  const publicUser = await convexQuery<{ username: string }, { _id: string; username: string } | null>("users:getPublicByUsername", {
    username,
  }).catch(() => null)

  if (!publicUser?._id) {
    notFound()
  }

  let storeData: any | null = null
  try {
    storeData = await getCachedStoreData(username)
  } catch (error) {
    console.error("Host store page load error:", error)
    return (
      <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Store Temporarily Unavailable</h1>
        <p className="max-w-xl text-muted-foreground">
          We could not load this store right now. Please refresh in a few moments.
        </p>
      </div>
    )
  }

  if (!storeData?.user) {
    notFound()
  }

  return (
    <StorefrontClient
      user={storeData.user}
      products={storeData.products || []}
      recentProducts={storeData.recentProducts || []}
      mostBoughtProducts={storeData.trending || []}
    />
  )
}
