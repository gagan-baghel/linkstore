import { queryGeneric } from "convex/server"
import { v } from "convex/values"

function withoutPassword(user: any) {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

function toProductView(product: any, performance: any) {
  return {
    ...product,
    category: product.category || "General",
    isArchived: product.isArchived === true,
    isLinkHealthy: product.isLinkHealthy !== false,
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
    const requestedUsername = args.username.trim()
    const normalizedUsername = requestedUsername.toLowerCase()

    let user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", requestedUsername))
      .first()

    if (!user && normalizedUsername !== requestedUsername) {
      user = await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", normalizedUsername)).first()
    }

    if (!user) {
      const allUsers = await ctx.db.query("users").collect()
      user = allUsers.find((candidate) => candidate.username.toLowerCase() === normalizedUsername) ?? null
    }

    if (!user) {
      return null
    }

    if (user.storeEnabled !== true) {
      return null
    }

    const allProducts = await ctx.db
      .query("products")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect()

    const products = allProducts.filter((product) => product.isArchived !== true && product.isLinkHealthy !== false)

    const now = Date.now()
    const last7Days = now - 7 * 24 * 60 * 60 * 1000
    const last30Days = now - 30 * 24 * 60 * 60 * 1000

    const events = await ctx.db
      .query("events")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect()

    const relevantEvents = events.filter((event) => event.createdAt >= last30Days)
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
      if (event.eventType === "outbound_click") {
        outbound30.set(event.productId, (outbound30.get(event.productId) || 0) + 1)
        if (event.createdAt >= last7Days) {
          outbound7.set(event.productId, (outbound7.get(event.productId) || 0) + 1)
        }
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

    const rankedProducts = [...products].sort((a, b) => {
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

    const recentProducts = [...products].sort((a, b) => b.createdAt - a.createdAt)

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
        ),
      )

    return {
      user: withoutPassword(user),
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
        ),
      ),
      topPicks,
      trending,
    }
  },
})
