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
    const now = Date.now()
    const last30Days = now - 30 * 24 * 60 * 60 * 1000
    const staleCutoff = now - 7 * 24 * 60 * 60 * 1000

    const [user, products, events, clicks] = await Promise.all([
      ctx.db.get(args.userId),
      ctx.db
        .query("products")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("events")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), last30Days))
        .order("desc")
        .collect(),
      ctx.db
        .query("clicks")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), last30Days))
        .order("desc")
        .collect(),
    ])

    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    let storeViews30 = 0
    let cardClicks30 = 0
    for (const event of events) {
      if (event.eventType === "store_view") storeViews30 += 1
      if (event.eventType === "product_card_click") cardClicks30 += 1
    }

    const outboundClicks30 = clicks.length
    const conversionRate30 = storeViews30 > 0 ? (outboundClicks30 / storeViews30) * 100 : 0

    const activeProducts: any[] = []
    const brokenProducts: any[] = []
    let staleCount = 0

    for (const product of products) {
      if (product.isArchived === true) continue
      activeProducts.push(product)

      if (product.isLinkHealthy === false) {
        brokenProducts.push(product)
      }

      if (typeof product.lastLinkCheckAt !== "number" || product.lastLinkCheckAt < staleCutoff) {
        staleCount += 1
      }
    }

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
        staleCount,
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

    const [products, clicks30, events30, leads30] = await Promise.all([
      ctx.db
        .query("products")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("clicks")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), last30Days))
        .order("desc")
        .collect(),
      ctx.db
        .query("events")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), last30Days))
        .order("desc")
        .collect(),
      ctx.db
        .query("audienceLeads")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), last30Days))
        .order("desc")
        .collect(),
    ])

    const activeProducts = products.filter((product) => product.isArchived !== true)

    const last7DayEvents = events30.filter((event) => event.createdAt >= last7Days)
    const clicks7 = clicks30.filter((click) => click.createdAt >= last7Days)
    const leads7 = leads30.filter((lead) => lead.createdAt >= last7Days)

    const storeViews30 = events30.filter((event) => event.eventType === "store_view").length
    const storeViews7 = last7DayEvents.filter((event) => event.eventType === "store_view").length
    const productCardClicks30 = events30.filter((event) => event.eventType === "product_card_click").length
    const productCardClicks7 = last7DayEvents.filter((event) => event.eventType === "product_card_click").length
    const outboundClicks30 = clicks30.length
    const outboundClicks7 = clicks7.length
    const leadsCount30 = leads30.length
    const leadsCount7 = leads7.length

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
    const sourceCounts = new Map<string, number>()
    const campaignCounts = new Map<string, number>()
    const deviceCounts = new Map<string, number>()
    const browserCounts = new Map<string, number>()
    const osCounts = new Map<string, number>()
    const countryCounts = new Map<string, number>()
    const cityCounts = new Map<string, number>()
    const collectionClickCounts = new Map<string, number>()
    const leadCollectionCounts = new Map<string, number>()
    const leadSourceCounts = new Map<string, number>()

    for (const event of events30) {
      const source = (event.source || "direct").trim() || "direct"
      const campaign = (event.campaign || "").trim() || "Organic"
      const device = (event.device || "unknown").trim() || "unknown"
      const browser = (event.browser || "").trim() || "Unknown"
      const os = (event.os || "").trim() || "Unknown"
      const country = (event.country || "").trim() || "Unknown"
      const city = (event.city || "").trim() || "Unknown"

      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
      campaignCounts.set(campaign, (campaignCounts.get(campaign) || 0) + 1)
      deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1)
      browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1)
      osCounts.set(os, (osCounts.get(os) || 0) + 1)
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1)
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1)

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

      const collectionKey = (click.collectionSlug || "").trim() || "Unattributed"
      collectionClickCounts.set(collectionKey, (collectionClickCounts.get(collectionKey) || 0) + 1)
    }

    for (const lead of leads30) {
      const collectionKey = (lead.collectionSlug || "").trim() || "Unattributed"
      const sourceKey = (lead.source || "").trim() || "direct"
      leadCollectionCounts.set(collectionKey, (leadCollectionCounts.get(collectionKey) || 0) + 1)
      leadSourceCounts.set(sourceKey, (leadSourceCounts.get(sourceKey) || 0) + 1)
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

    const campaignChartData = Array.from(campaignCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))

    const browserChartData = Array.from(browserCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))

    const osChartData = Array.from(osCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))

    const countryChartData = Array.from(countryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))

    const cityChartData = Array.from(cityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, clicks]) => ({
        id: name,
        name,
        clicks,
      }))

    const collectionPerformanceData = Array.from(collectionClickCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, clicks]) => ({
        id: name,
        name,
        clicks,
      }))

    const leadsByCollectionData = Array.from(leadCollectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, clicks]) => ({
        id: name,
        name,
        clicks,
      }))

    const leadsBySourceData = Array.from(leadSourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))

    const recentClicksData = clicks30.slice(0, 10).map((click) => {
      const product = productMap.get(click.productId)
      return {
        _id: click._id,
        createdAt: click.createdAt,
        source: click.source || "direct",
        referrer: click.referrer || "",
        device: click.device || "unknown",
        browser: click.browser || "Unknown",
        os: click.os || "Unknown",
        deviceName: click.deviceName || "Unknown",
        country: click.country || "",
        city: click.city || "",
        collectionSlug: click.collectionSlug || "",
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
      leadsCount7,
      leadsCount30,
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
      campaignChartData,
      browserChartData,
      osChartData,
      countryChartData,
      cityChartData,
      collectionPerformanceData,
      leadsByCollectionData,
      leadsBySourceData,
      recentClicksData,
      funnelData: [
        { name: "Store Views (30d)", value: storeViews30 },
        { name: "Card Clicks (30d)", value: productCardClicks30 },
        { name: "Outbound Clicks (30d)", value: outboundClicks30 },
        { name: "Leads (30d)", value: leadsCount30 },
      ],
    }
  },
})
