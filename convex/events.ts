import { mutationGeneric } from "convex/server"
import { v } from "convex/values"

export const trackEvent = mutationGeneric({
  args: {
    eventType: v.union(v.literal("store_view"), v.literal("product_card_click"), v.literal("outbound_click")),
    userId: v.id("users"),
    productId: v.optional(v.id("products")),
    storeUsername: v.string(),
    source: v.optional(v.string()),
    referrer: v.optional(v.string()),
    device: v.optional(v.string()),
    path: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "Store owner not found" as const }
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
      referrer: args.referrer || "",
      device: args.device || "unknown",
      path: args.path || "",
      sessionId: args.sessionId || "",
      userAgent: args.userAgent || "",
      ip: args.ip || "",
      createdAt: Date.now(),
    })

    return { ok: true }
  },
})
