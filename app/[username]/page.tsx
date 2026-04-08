import { notFound } from "next/navigation"

import { StorefrontClient } from "@/components/storefront-client"
import { convexQuery } from "@/lib/convex"
import { getCachedStoreData } from "@/lib/store-cache"

export const dynamic = "force-dynamic"

interface StorePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { username } = await params

  const publicUser = await convexQuery<{ username: string }, { _id: string; username: string } | null>(
    "users:getPublicByUsername",
    {
      username,
    },
  ).catch(() => null)

  if (!publicUser?._id) {
    notFound()
  }

  let storeData: any | null = null
  try {
    storeData = await getCachedStoreData(username)
  } catch (error) {
    console.error("Store page load error:", error)
    return (
      <div className="container flex min-h-96 flex-col items-center justify-center gap-4 py-16 text-center">
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
