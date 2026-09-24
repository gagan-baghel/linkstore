import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { StorefrontClient } from "@/components/storefront-client"
import { Button } from "@/components/ui/button"
import { getCachedStoreData } from "@/lib/store-cache"
import { buildStorefrontUrl } from "@/lib/storefront-url"

export const dynamic = "force-dynamic"

interface StorePageProps {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { username } = await params
  const storeData = await getCachedStoreData(username).catch(() => null)
  const user = storeData?.user
  if (!user) {
    return { title: "Store Not Found - Linkstore", robots: { index: false } }
  }

  const storeName = user.storeBannerText?.trim() || user.name?.trim() || user.username
  const productCount = storeData?.products?.length || 0
  const description =
    user.storeBio?.trim() ||
    `Shop ${productCount > 0 ? `${productCount} ` : ""}curated picks from ${storeName} on Linkstore.`
  const canonical = buildStorefrontUrl(user.username)

  return {
    title: `${storeName} (@${user.username}) - Linkstore`,
    description,
    alternates: { canonical },
    // og:image comes from ./opengraph-image.tsx (a generated 1200×630 store card).
    openGraph: {
      title: `${storeName} (@${user.username})`,
      description,
      url: canonical,
      type: "profile",
      siteName: "Linkstore",
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} (@${user.username})`,
      description,
    },
  }
}

function buildStoreJsonLd(user: any, products: any[]) {
  const canonical = buildStorefrontUrl(user.username)
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: user.name || user.username,
      url: canonical,
      ...(user.storeLogo ? { image: user.storeLogo } : {}),
      ...(user.storeBio ? { description: user.storeBio } : {}),
    },
    hasPart: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.title,
          url: canonical,
          ...(product.images?.[0]?.startsWith("http") ? { image: product.images[0] } : {}),
        },
      })),
    },
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { username } = await params

  // Handled inline rather than thrown to error.tsx so the message is
  // server-rendered and the retry works without client JS. Note this responds
  // 200: the shell has already flushed by the time a page can fail, so uptime
  // checks must use /api/health, not a storefront URL.
  let storeData: any | null = null
  try {
    storeData = await getCachedStoreData(username)
  } catch (error) {
    console.error("Store page load error:", error)
    return (
      <div className="container flex min-h-96 flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Store Temporarily Unavailable</h1>
        <p className="max-w-xl text-muted-foreground">
          We could not load this store right now. Please try again in a few moments.
        </p>
        {/* Plain anchor, not Link: a client-side nav to the same route would
            not refetch, so retry needs a full document request. */}
        <Button asChild>
          <a href={`/${encodeURIComponent(username)}`}>Try Again</a>
        </Button>
      </div>
    )
  }

  if (!storeData?.user) {
    notFound()
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStoreJsonLd(storeData.user, storeData.products || [])) }}
      />
      <StorefrontClient
        user={storeData.user}
        products={storeData.products || []}
        recentProducts={storeData.recentProducts || []}
        mostBoughtProducts={storeData.trending || []}
      />
    </>
  )
}
