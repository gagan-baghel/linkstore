import { mutationGeneric } from "convex/server"
import { v } from "convex/values"

export const trackEvent = mutationGeneric({
  args: {
    eventType: v.union(v.literal("store_view"), v.literal("product_card_click"), v.literal("outbound_click")),
    userId: v.id("users"),
    productId: v.optional(v.id("products")),
    storeUsername: v.string(),
    source: v.optional(v.string()),
    medium: v.optional(v.string()),
    campaign: v.optional(v.string()),
    content: v.optional(v.string()),
    term: v.optional(v.string()),
    referrer: v.optional(v.string()),
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
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "Store owner not found" as const }
    }

    if (user.username.trim().toLowerCase() !== args.storeUsername.trim().toLowerCase()) {
      return { ok: false, message: "Store mismatch" as const }
    }

    if (args.productId) {
      const product = await ctx.db.get(args.productId)
      if (!product || product.userId !== args.userId) {
        return { ok: false, message: "Product not found" as const }
      }
    }

    await ctx.db.insert("events", {
      eventType: args.eventType,
      userId: args.userId,
      productId: args.productId,
      storeUsername: args.storeUsername.trim().toLowerCase(),
      source: args.source || "direct",
      medium: args.medium || "",
      campaign: args.campaign || "",
      content: args.content || "",
      term: args.term || "",
      referrer: args.referrer || "",
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
      userAgent: args.userAgent || "",
      ip: args.ip || "",
      createdAt: Date.now(),
    })

    return { ok: true }
  },
})
