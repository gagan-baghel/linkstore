import { mutationGeneric } from "convex/server"
import { v } from "convex/values"

export const trackClick = mutationGeneric({
  args: {
    productId: v.id("products"),
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.string(),
    source: v.optional(v.string()),
    device: v.optional(v.string()),
    path: v.optional(v.string()),
    sessionId: v.optional(v.string()),
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
      createdAt: now,
    })

    await ctx.db.insert("events", {
      eventType: "outbound_click",
      userId: product.userId,
      productId: product._id,
      storeUsername: user.username,
      source: args.source || "direct",
      referrer: args.referrer || "",
      device: args.device || "unknown",
      path: args.path || "",
      sessionId: args.sessionId || "",
      userAgent: args.userAgent || "",
      ip: args.ip || "",
      createdAt: now,
    })

    return { ok: true, affiliateUrl: product.affiliateUrl }
  },
})
