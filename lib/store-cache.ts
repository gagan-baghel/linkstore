import { unstable_cache } from "next/cache"

import { convexQuery } from "@/lib/convex"
import { fetchProductMetadata } from "@/lib/product-metadata"

function hasImage(product: any) {
  if (!Array.isArray(product?.images) || product.images.length === 0) return false
  const firstImage = typeof product.images[0] === "string" ? product.images[0].trim() : ""
  if (!firstImage) return false
  const normalized = firstImage.toLowerCase()
  return !(
    normalized === "/placeholder.jpg" ||
    normalized === "/placeholder.svg" ||
    normalized.startsWith("/placeholder.svg?")
  )
}

async function hydrateProductsWithMetadataImages(products: any[] = []) {
  const hydrated = await Promise.all(
    products.map(async (product) => {
      if (hasImage(product) || typeof product?.affiliateUrl !== "string" || product.affiliateUrl.trim().length === 0) {
        return product
      }

      try {
        const metadata = await fetchProductMetadata(product.affiliateUrl.trim())
        if (!metadata.image) return product
        return { ...product, images: [metadata.image] }
      } catch {
        return product
      }
    }),
  )

  return hydrated
}

function applyHydratedImagesToList(list: any[] = [], productsById: Map<string, any>) {
  return list.map((item) => {
    const id = String(item?._id ?? "")
    return productsById.get(id) || item
  })
}

export function getStoreCacheTag(username: string) {
  return `store:${username.trim().toLowerCase()}`
}

function getStoreDataByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase()
  return unstable_cache(
    async () => {
      const storeData = await convexQuery<{ username: string }, any | null>("stores:getByUsername", {
        username: normalizedUsername,
      })
      if (!storeData) return null

      const hydratedProducts = await hydrateProductsWithMetadataImages(storeData.products || [])
      const byId = new Map<string, any>(hydratedProducts.map((item: any) => [String(item?._id ?? ""), item]))

      return {
        ...storeData,
        products: hydratedProducts,
        recentProducts: applyHydratedImagesToList(storeData.recentProducts || [], byId),
        trending: applyHydratedImagesToList(storeData.trending || [], byId),
      }
    },
    ["store-by-username", normalizedUsername],
    { revalidate: 300, tags: [getStoreCacheTag(normalizedUsername)] },
  )
}

export async function getCachedStoreData(username: string) {
  return getStoreDataByUsername(username)()
}
