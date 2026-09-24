import { queryGeneric } from "../lib/convex-guard"
import { v } from "convex/values"

import { getEffectiveSubscriptionStatus, pickCanonicalSubscription, resolveStoreEnabled } from "../lib/subscription-billing"
import { getEffectiveProductNumbers } from "../lib/product-number"

// Everything returned here is serialized into public storefront HTML, so only
// whitelisted display fields may leave (never email, googleSub, role, etc).
const PUBLIC_USER_FIELDS = [
  "_id",
  "name",
  "username",
  "storeLogo",
  "storeBio",
  "storeBannerText",
  "contactInfo",
  "themeMode",
  "themePrimaryColor",
  "themeAccentColor",
  "themeBannerStyle",
  "themeButtonStyle",
  "themeCardStyle",
  "themeFooterVisible",
  "themeBackgroundColor",
  "themeBackgroundPattern",
  "themeNameColor",
  "themeBioColor",
  "themeNameFont",
  "themeBioFont",
  "socialFacebook",
  "socialTwitter",
  "socialInstagram",
  "socialYoutube",
  "socialWebsite",
  "socialWhatsapp",
  "socialWhatsappMessage",
  "customLinks",
  "leadCaptureChannel",
] as const

function toPublicUser(user: any) {
  return Object.fromEntries(PUBLIC_USER_FIELDS.filter((key) => user[key] !== undefined).map((key) => [key, user[key]]))
}

async function findEnabledStoreOwner(ctx: any, username: string) {
  const normalizedUsername = normalizeUsernameInput(username)
  if (!normalizedUsername) return null

  const user = await ctx.db
    .query("users")
    .withIndex("by_username", (q: any) => q.eq("username", normalizedUsername))
    .first()
  if (!user) return null

  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
    .collect()

  const subscription = pickCanonicalSubscription(subscriptions, Date.now())
  const hasActiveSubscription = getEffectiveSubscriptionStatus(subscription, Date.now()) === "active"
  if (!resolveStoreEnabled({ userStoreEnabled: user.storeEnabled, hasActiveSubscription })) {
    return null
  }
  return user
}

function normalizeUsernameInput(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase()
}

function toProductView(product: any, performance: any, productNumber?: number) {
  return {
    _id: product._id,
    title: product.title,
    affiliateUrl: product.affiliateUrl,
    images: product.images,
    description: product.description,
    price: product.price,
    productNumber,
    isPinned: product.isPinned === true,
    createdAt: product.createdAt,
    category: product.category || "General",
    ctr7d: performance.ctr7d,
    ctr30d: performance.ctr30d,
    clicks7d: performance.clicks7d,
    clicks30d: performance.clicks30d,
    outbound7d: performance.outbound7d,
    outbound30d: performance.outbound30d,
    performanceScore: performance.performanceScore,
    isTrending: performance.clicks7d > 0,
  }
}

export const getByUsername = queryGeneric({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await findEnabledStoreOwner(ctx, args.username)
    if (!user) {
      return null
    }

    const now = Date.now()
    const last7Days = now - 7 * 24 * 60 * 60 * 1000
    const last30Days = now - 30 * 24 * 60 * 60 * 1000

    const [allProducts, relevantEvents, relevantClicks] = await Promise.all([
      ctx.db
        .query("products")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect(),
      ctx.db
        .query("events")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
        .filter((q) => q.gte(q.field("createdAt"), last30Days))
        .order("desc")
        .collect(),
      ctx.db
        .query("clicks")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
        .filter((q) => q.gte(q.field("createdAt"), last30Days))
        .order("desc")
        .collect(),
    ])

    const productNumbers = getEffectiveProductNumbers(allProducts)
    const products = allProducts.filter((product) => product.isArchived !== true && product.isLinkHealthy !== false)
    const storeViews7 = relevantEvents.filter((event) => event.eventType === "store_view" && event.createdAt >= last7Days).length
    const storeViews30 = relevantEvents.filter((event) => event.eventType === "store_view").length

    const cardClicks7 = new Map<string, number>()
    const cardClicks30 = new Map<string, number>()
    const outbound7 = new Map<string, number>()
    const outbound30 = new Map<string, number>()

    for (const event of relevantEvents) {
      if (!event.productId) continue
      if (event.eventType === "product_card_click") {
        cardClicks30.set(event.productId, (cardClicks30.get(event.productId) || 0) + 1)
        if (event.createdAt >= last7Days) {
          cardClicks7.set(event.productId, (cardClicks7.get(event.productId) || 0) + 1)
        }
      }
    }

    for (const click of relevantClicks) {
      outbound30.set(click.productId, (outbound30.get(click.productId) || 0) + 1)
      if (click.createdAt >= last7Days) {
        outbound7.set(click.productId, (outbound7.get(click.productId) || 0) + 1)
      }
    }

    const performanceMap = new Map<
      string,
      {
        ctr7d: number
        ctr30d: number
        clicks7d: number
        clicks30d: number
        outbound7d: number
        outbound30d: number
        performanceScore: number
      }
    >()

    for (const product of products) {
      const clicks7d = cardClicks7.get(product._id) || 0
      const clicks30d = cardClicks30.get(product._id) || 0
      const outboundClicks7d = outbound7.get(product._id) || 0
      const outboundClicks30d = outbound30.get(product._id) || 0

      const ctr7d = storeViews7 > 0 ? clicks7d / storeViews7 : 0
      const ctr30d = storeViews30 > 0 ? clicks30d / storeViews30 : 0
      const performanceScore = ctr7d * 0.65 + ctr30d * 0.35 + outboundClicks7d * 0.015 + outboundClicks30d * 0.005

      performanceMap.set(product._id, {
        ctr7d,
        ctr30d,
        clicks7d,
        clicks30d,
        outbound7d: outboundClicks7d,
        outbound30d: outboundClicks30d,
        performanceScore,
      })
    }

    const pinnedFirst = (a: any, b: any) => Number(b.isPinned === true) - Number(a.isPinned === true)
    const rankedProducts = [...products].sort((a, b) => {
      if (pinnedFirst(a, b) !== 0) return pinnedFirst(a, b)
      const aMetrics = performanceMap.get(a._id) ?? {
        ctr7d: 0,
        ctr30d: 0,
        clicks7d: 0,
        clicks30d: 0,
        outbound7d: 0,
        outbound30d: 0,
        performanceScore: 0,
      }
      const bMetrics = performanceMap.get(b._id) ?? {
        ctr7d: 0,
        ctr30d: 0,
        clicks7d: 0,
        clicks30d: 0,
        outbound7d: 0,
        outbound30d: 0,
        performanceScore: 0,
      }

      if (bMetrics.performanceScore !== aMetrics.performanceScore) {
        return bMetrics.performanceScore - aMetrics.performanceScore
      }
      return b.createdAt - a.createdAt
    })

    const recentProducts = [...products].sort((a, b) => pinnedFirst(a, b) || b.createdAt - a.createdAt)

    const topPicks = rankedProducts
      .slice(0, 6)
      .map((product) =>
        toProductView(
          product,
          performanceMap.get(product._id) ?? {
            ctr7d: 0,
            ctr30d: 0,
            clicks7d: 0,
            clicks30d: 0,
            outbound7d: 0,
            outbound30d: 0,
            performanceScore: 0,
          },
          productNumbers.get(String(product._id)),
        ),
      )

    const trending = [...rankedProducts]
      .sort((a, b) => {
        const aMetrics = performanceMap.get(a._id)
        const bMetrics = performanceMap.get(b._id)
        const aOutbound7 = aMetrics?.outbound7d ?? 0
        const bOutbound7 = bMetrics?.outbound7d ?? 0
        if (bOutbound7 !== aOutbound7) return bOutbound7 - aOutbound7
        const aOutbound30 = aMetrics?.outbound30d ?? 0
        const bOutbound30 = bMetrics?.outbound30d ?? 0
        if (bOutbound30 !== aOutbound30) return bOutbound30 - aOutbound30
        const aClicks = aMetrics?.clicks7d ?? 0
        const bClicks = bMetrics?.clicks7d ?? 0
        if (bClicks !== aClicks) return bClicks - aClicks
        return b.createdAt - a.createdAt
      })
      .slice(0, 6)
      .map((product) =>
        toProductView(
          product,
          performanceMap.get(product._id) ?? {
            ctr7d: 0,
            ctr30d: 0,
            clicks7d: 0,
            clicks30d: 0,
            outbound7d: 0,
            outbound30d: 0,
            performanceScore: 0,
          },
          productNumbers.get(String(product._id)),
        ),
      )

    return {
      user: toPublicUser(user),
      products: rankedProducts.map((product) =>
        toProductView(
          product,
          performanceMap.get(product._id) ?? {
            ctr7d: 0,
            ctr30d: 0,
            clicks7d: 0,
            clicks30d: 0,
            outbound7d: 0,
            outbound30d: 0,
            performanceScore: 0,
          },
          productNumbers.get(String(product._id)),
        ),
      ),
      recentProducts: recentProducts.map((product) =>
        toProductView(
          product,
          performanceMap.get(product._id) ?? {
            ctr7d: 0,
            ctr30d: 0,
            clicks7d: 0,
            clicks30d: 0,
            outbound7d: 0,
            outbound30d: 0,
            performanceScore: 0,
          },
          productNumbers.get(String(product._id)),
        ),
      ),
      topPicks,
      trending,
    }
  },
})

// Resolves /{username}/{number} short links to a live product.
export const getProductByNumber = queryGeneric({
  args: {
    username: v.string(),
    productNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await findEnabledStoreOwner(ctx, args.username)
    if (!user) return null

    const products = await ctx.db
      .query("products")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect()
    const numbers = getEffectiveProductNumbers(products)
    const product = products.find((doc) => numbers.get(String(doc._id)) === args.productNumber)
    if (!product || product.isArchived === true || product.isLinkHealthy === false) return null
    return { productId: product._id }
  },
})
