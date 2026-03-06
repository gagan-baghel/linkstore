import { queryGeneric } from "convex/server"
import { v } from "convex/values"

function withoutPassword(user: any) {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

function toDayKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function sanitizeProduct(product: any) {
  if (!product) return product
  const { description, videoUrl, ...rest } = product
  return rest
}

export const getDashboardData = queryGeneric({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    const now = Date.now()
    const last30Days = now - 30 * 24 * 60 * 60 * 1000
    const events = await ctx.db
      .query("events")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), last30Days))
      .order("desc")
      .collect()
    const clicks = await ctx.db
      .query("clicks")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), last30Days))
      .order("desc")
      .collect()
    const storeViews30 = events.filter((event) => event.eventType === "store_view").length
    const cardClicks30 = events.filter((event) => event.eventType === "product_card_click").length
    const outboundClicks30 = clicks.length
    const conversionRate30 = storeViews30 > 0 ? (outboundClicks30 / storeViews30) * 100 : 0

    const activeProducts = products.filter((product) => product.isArchived !== true)
    const brokenProducts = activeProducts.filter((product) => product.isLinkHealthy === false)
    const staleCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const staleProducts = activeProducts.filter(
      (product) => typeof product.lastLinkCheckAt !== "number" || product.lastLinkCheckAt < staleCutoff,
    )

    return {
      ok: true,
      user: withoutPassword(user),
      totalProducts: activeProducts.length,
      recentProducts: activeProducts.slice(0, 3).map(sanitizeProduct),
      quickMetrics: {
        storeViews30,
        cardClicks30,
        outboundClicks30,
        conversionRate30,
      },
      linkHealth: {
        brokenCount: brokenProducts.length,
        staleCount: staleProducts.length,
        brokenProducts: brokenProducts.slice(0, 5).map((product) => ({
          id: product._id,
          title: product.title,
          status: product.lastLinkStatus,
          checkedAt: product.lastLinkCheckAt,
          error: product.lastLinkError || "",
        })),
      },
    }
  },
})

export const getAnalyticsData = queryGeneric({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now()
    const last7Days = now - 7 * 24 * 60 * 60 * 1000
    const last30Days = now - 30 * 24 * 60 * 60 * 1000

    const products = await ctx.db
      .query("products")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()
    const activeProducts = products.filter((product) => product.isArchived !== true)

    const clicks30 = await ctx.db
      .query("clicks")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), last30Days))
      .order("desc")
      .collect()

    const events30 = await ctx.db
      .query("events")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), last30Days))
      .order("desc")
      .collect()

    const last7DayEvents = events30.filter((event) => event.createdAt >= last7Days)
    const clicks7 = clicks30.filter((click) => click.createdAt >= last7Days)

    const storeViews30 = events30.filter((event) => event.eventType === "store_view").length
    const storeViews7 = last7DayEvents.filter((event) => event.eventType === "store_view").length
    const productCardClicks30 = events30.filter((event) => event.eventType === "product_card_click").length
    const productCardClicks7 = last7DayEvents.filter((event) => event.eventType === "product_card_click").length
    const outboundClicks30 = clicks30.length
    const outboundClicks7 = clicks7.length

    const totalProducts = activeProducts.length
    const totalClicks = outboundClicks30
    const recentClicks = outboundClicks7
    const last30DaysClicks = outboundClicks30

    const productMap = new Map(activeProducts.map((product) => [product._id, product]))
    const cardClickMap30 = new Map<string, number>()
    const cardClickMap7 = new Map<string, number>()
    const outboundMap30 = new Map<string, number>()
    const outboundMap7 = new Map<string, number>()
    const dayCounts = new Map<string, number>()

    for (const event of events30) {
      if (!event.productId) continue

      if (event.eventType === "product_card_click") {
        cardClickMap30.set(event.productId, (cardClickMap30.get(event.productId) || 0) + 1)
        if (event.createdAt >= last7Days) {
          cardClickMap7.set(event.productId, (cardClickMap7.get(event.productId) || 0) + 1)
        }
      }
    }

    for (const click of clicks30) {
      outboundMap30.set(click.productId, (outboundMap30.get(click.productId) || 0) + 1)
      if (click.createdAt >= last7Days) {
        outboundMap7.set(click.productId, (outboundMap7.get(click.productId) || 0) + 1)
      }
      const key = toDayKey(click.createdAt)
      dayCounts.set(key, (dayCounts.get(key) || 0) + 1)
    }

    const productClicksData = activeProducts.map((product) => ({
      id: product._id,
      name: product.title,
      clicks: outboundMap30.get(product._id) || 0,
    }))

    const productPerformanceData = activeProducts
      .map((product) => {
        const cardClicksFor7d = cardClickMap7.get(product._id) || 0
        const cardClicksFor30d = cardClickMap30.get(product._id) || 0
        const outboundFor7d = outboundMap7.get(product._id) || 0
        const outboundFor30d = outboundMap30.get(product._id) || 0
        const ctr7d = storeViews7 > 0 ? (cardClicksFor7d / storeViews7) * 100 : 0
        const ctr30d = storeViews30 > 0 ? (cardClicksFor30d / storeViews30) * 100 : 0
        const outboundRate = cardClicksFor30d > 0 ? (outboundFor30d / cardClicksFor30d) * 100 : 0

        return {
          id: product._id,
          name: product.title,
          category: product.category || "General",
          cardClicks7d: cardClicksFor7d,
          cardClicks30d: cardClicksFor30d,
          outbound7d: outboundFor7d,
          outbound30d: outboundFor30d,
          ctr7d,
          ctr30d,
          outboundRate,
        }
      })
      .sort((a, b) => b.ctr7d - a.ctr7d)

    const referrerCounts = new Map<string, number>()
    for (const click of clicks30) {
      if (!click.referrer) continue
      let domain = click.referrer
      try {
        domain = new URL(click.referrer).hostname
      } catch {
        // Keep referrer as-is if it is not a valid URL.
      }
      referrerCounts.set(domain, (referrerCounts.get(domain) || 0) + 1)
    }

    const sourceCounts = new Map<string, number>()
    for (const event of events30) {
      const source = event.source || "direct"
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
    }

    const deviceCounts = new Map<string, number>()
    for (const event of events30) {
      const device = event.device || "unknown"
      deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1)
    }

    const referrerChartData = Array.from(referrerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))

    const sourceChartData = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))

    const deviceChartData = Array.from(deviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    const recentClicksData = clicks30.slice(0, 10).map((click) => {
      const product = productMap.get(click.productId)
      return {
        _id: click._id,
        createdAt: click.createdAt,
        source: "direct",
        referrer: click.referrer || "",
        device: "unknown",
        productId: product
          ? {
              title: product.title,
              affiliateUrl: product.affiliateUrl,
            }
          : null,
      }
    })

    const conversionRate = storeViews30 > 0 ? (outboundClicks30 / storeViews30) * 100 : 0

    return {
      totalProducts,
      totalClicks,
      recentClicks,
      last30DaysClicks,
      storeViews7,
      storeViews30,
      productCardClicks7,
      productCardClicks30,
      outboundClicks7,
      outboundClicks30,
      conversionRate,
      productClicksData,
      productPerformanceData,
      dailyClicksData: Array.from(dayCounts.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => ({
          date,
          clicks: count,
        })),
      referrerChartData,
      sourceChartData,
      deviceChartData,
      recentClicksData,
      funnelData: [
        { name: "Store Views (30d)", value: storeViews30 },
        { name: "Card Clicks (30d)", value: productCardClicks30 },
        { name: "Outbound Clicks (30d)", value: outboundClicks30 },
      ],
    }
  },
})
