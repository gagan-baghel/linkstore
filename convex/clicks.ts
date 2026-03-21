import { mutationGeneric } from "convex/server"
import { v } from "convex/values"

export const trackClick = mutationGeneric({
  args: {
    productId: v.id("products"),
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.string(),
    source: v.optional(v.string()),
    medium: v.optional(v.string()),
    campaign: v.optional(v.string()),
    content: v.optional(v.string()),
    term: v.optional(v.string()),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    deviceName: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    path: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    collectionSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return { ok: false, message: "Product not found" as const }
    }

    const user = await ctx.db.get(product.userId)
    if (!user) {
      return { ok: false, message: "Store owner not found" as const }
    }

    const now = Date.now()

    await ctx.db.insert("clicks", {
      productId: product._id,
      userId: product.userId,
      ip: args.ip,
      userAgent: args.userAgent,
      referrer: args.referrer,
      source: args.source || "direct",
      medium: args.medium || "",
      campaign: args.campaign || "",
      content: args.content || "",
      term: args.term || "",
      device: args.device || "unknown",
      browser: args.browser || "",
      os: args.os || "",
      deviceName: args.deviceName || "",
      country: args.country || "",
      region: args.region || "",
      city: args.city || "",
      path: args.path || "",
      sessionId: args.sessionId || "",
      collectionSlug: args.collectionSlug || "",
      createdAt: now,
    })

    return { ok: true, affiliateUrl: product.affiliateUrl }
  },
})
