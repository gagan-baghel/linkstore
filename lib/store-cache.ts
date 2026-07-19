import { unstable_cache } from "next/cache"
import { cache } from "react"

import { convexQuery } from "@/lib/convex"

export function getStoreCacheTag(username: string) {
  return `store:${username.trim().toLowerCase()}`
}

async function fetchStoreDataByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase()
  if (!normalizedUsername) return null

  const storeData = await convexQuery<{ username: string }, any | null>("stores:getByUsername", {
    username: normalizedUsername,
  })
  if (!storeData) return null

  // Keep storefront responses independent from third-party affiliate hosts.
  // Metadata enrichment happens during product creation/edit flows, not page render.
  return storeData
}

function getStoreDataByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase()
  return unstable_cache(
    async () => fetchStoreDataByUsername(normalizedUsername),
    ["store-by-username", normalizedUsername],
    { revalidate: 300, tags: [getStoreCacheTag(normalizedUsername)] },
  )
}

// React.cache dedupes the lookup between generateMetadata and the page render.
export const getCachedStoreData = cache(async (username: string) => {
  const cachedStoreData = await getStoreDataByUsername(username)()
  if (cachedStoreData) {
    return cachedStoreData
  }

  // Avoid serving a stale cached miss right after subscription/store access changes.
  return fetchStoreDataByUsername(username)
})
