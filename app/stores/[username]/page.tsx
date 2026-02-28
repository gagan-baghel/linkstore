import { notFound } from "next/navigation"

import { getCachedStoreData } from "@/lib/store-cache"
import { StorefrontClient } from "@/components/storefront-client"

export const revalidate = 300

interface StorePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { username } = await params

  let storeData: any | null = null
  try {
    storeData = await getCachedStoreData(username)
  } catch (error) {
    console.error("Store page load error:", error)
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
