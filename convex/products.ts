import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

const PRODUCT_LIMIT = 200

function normalizeCategory(category?: string) {
  const normalized = (category || "").trim()
  return normalized.length > 0 ? normalized : "General"
}

async function hasActiveSubscription(ctx: any, userId: string) {
  const rows = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect()

  if (rows.length !== 1) {
    return { ok: false as const, message: "Subscription state is ambiguous." }
  }

  const subscription = rows[0]
  const isActive = subscription.status === "active" && typeof subscription.expiresAt === "number" && subscription.expiresAt > Date.now()
  if (!isActive) {
    return { ok: false as const, message: "Active subscription is required." }
  }

  return { ok: true as const }
}

async function countProductsForUser(ctx: any, userId: string) {
  const docs = await ctx.db.query("products").withIndex("by_userId", (q: any) => q.eq("userId", userId)).collect()
  return docs.length
}

export const listByUser = queryGeneric({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("products")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    const includeArchived = args.includeArchived ?? true
    const filtered = includeArchived ? docs : docs.filter((product) => product.isArchived !== true)

    return typeof args.limit === "number" ? filtered.slice(0, args.limit) : filtered
  },
})

export const countByUser = queryGeneric({
  args: {
    userId: v.id("users"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db.query("products").withIndex("by_userId", (q) => q.eq("userId", args.userId)).collect()
    const includeArchived = args.includeArchived ?? true
    return includeArchived ? docs.length : docs.filter((product) => product.isArchived !== true).length
  },
})

export const getById = queryGeneric({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId)
  },
})

export const getByIdForUser = queryGeneric({
  args: {
    productId: v.id("products"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product || product.userId !== args.userId) {
      return null
    }
    return product
  },
})

export const getLinkHealthSummary = queryGeneric({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    const activeProducts = products.filter((product) => product.isArchived !== true)
    const now = Date.now()
    const staleCutoff = now - 7 * 24 * 60 * 60 * 1000

    const brokenProducts = activeProducts.filter((product) => product.isLinkHealthy === false)
    const staleProducts = activeProducts.filter(
      (product) => typeof product.lastLinkCheckAt !== "number" || product.lastLinkCheckAt < staleCutoff,
    )

    return {
      totalActiveProducts: activeProducts.length,
      brokenCount: brokenProducts.length,
      staleCount: staleProducts.length,
      brokenProducts: brokenProducts.slice(0, 5).map((product) => ({
        id: product._id,
        title: product.title,
        status: product.lastLinkStatus,
        checkedAt: product.lastLinkCheckAt,
        error: product.lastLinkError || "",
      })),
    }
  },
})

export const createProduct = mutationGeneric({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    affiliateUrl: v.string(),
    images: v.array(v.string()),
    videoUrl: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const, code: "USER_NOT_FOUND" as const }
    }

    const subscriptionCheck = await hasActiveSubscription(ctx, args.userId)
    if (!subscriptionCheck.ok) {
      return { ok: false, message: subscriptionCheck.message, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    const currentProductCount = await countProductsForUser(ctx, args.userId)
    if (currentProductCount >= PRODUCT_LIMIT) {
      return {
        ok: false,
        message: `Product limit reached (${PRODUCT_LIMIT}).`,
        code: "PRODUCT_LIMIT_REACHED" as const,
      }
    }

    const now = Date.now()
    const productId = await ctx.db.insert("products", {
      userId: args.userId,
      title: args.title.trim(),
      description: args.description.trim(),
      affiliateUrl: args.affiliateUrl.trim(),
      images: args.images,
      videoUrl: args.videoUrl || "",
      category: normalizeCategory(args.category),
      isArchived: false,
      isLinkHealthy: true,
      lastLinkCheckAt: undefined,
      lastLinkStatus: undefined,
      lastLinkError: "",
      linkFailureCount: 0,
      createdAt: now,
      updatedAt: now,
    })

    const product = await ctx.db.get(productId)
    return { ok: true, product }
  },
})

export const bulkCreateByUser = mutationGeneric({
  args: {
    userId: v.id("users"),
    products: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        affiliateUrl: v.string(),
        images: v.array(v.string()),
        videoUrl: v.optional(v.string()),
        category: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const, created: 0, code: "USER_NOT_FOUND" as const }
    }

    const subscriptionCheck = await hasActiveSubscription(ctx, args.userId)
    if (!subscriptionCheck.ok) {
      return { ok: false, message: subscriptionCheck.message, created: 0, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    const existingCount = await countProductsForUser(ctx, args.userId)
    const remainingSlots = Math.max(PRODUCT_LIMIT - existingCount, 0)
    if (remainingSlots <= 0) {
      return {
        ok: false,
        message: `Product limit reached (${PRODUCT_LIMIT}).`,
        created: 0,
        code: "PRODUCT_LIMIT_REACHED" as const,
      }
    }

    const now = Date.now()
    let created = 0

    for (const product of args.products) {
      if (created >= remainingSlots) {
        break
      }
      if (!product.title.trim() || !product.affiliateUrl.trim()) {
        continue
      }

      await ctx.db.insert("products", {
        userId: args.userId,
        title: product.title.trim(),
        description: product.description.trim(),
        affiliateUrl: product.affiliateUrl.trim(),
        images: product.images,
        videoUrl: product.videoUrl || "",
        category: normalizeCategory(product.category),
        isArchived: false,
        isLinkHealthy: true,
        lastLinkCheckAt: undefined,
        lastLinkStatus: undefined,
        lastLinkError: "",
        linkFailureCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      created += 1
    }

    return { ok: true, created, remainingSlotsAfter: Math.max(remainingSlots - created, 0) }
  },
})

export const updateByIdForUser = mutationGeneric({
  args: {
    productId: v.id("products"),
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    affiliateUrl: v.string(),
    images: v.array(v.string()),
    videoUrl: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product || product.userId !== args.userId) {
      return { ok: false, message: "Product not found" as const }
    }

    const subscriptionCheck = await hasActiveSubscription(ctx, args.userId)
    if (!subscriptionCheck.ok) {
      return { ok: false, message: subscriptionCheck.message, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    await ctx.db.patch(args.productId, {
      title: args.title.trim(),
      description: args.description.trim(),
      affiliateUrl: args.affiliateUrl.trim(),
      images: args.images,
      videoUrl: args.videoUrl || "",
      category: normalizeCategory(args.category),
      updatedAt: Date.now(),
    })

    const updated = await ctx.db.get(args.productId)
    return { ok: true, product: updated }
  },
})

export const quickUpdateByIdForUser = mutationGeneric({
  args: {
    productId: v.id("products"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    affiliateUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product || product.userId !== args.userId) {
      return { ok: false, message: "Product not found" as const }
    }

    const subscriptionCheck = await hasActiveSubscription(ctx, args.userId)
    if (!subscriptionCheck.ok) {
      return { ok: false, message: subscriptionCheck.message, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (typeof args.title === "string") patch.title = args.title.trim()
    if (typeof args.affiliateUrl === "string") patch.affiliateUrl = args.affiliateUrl.trim()
    if (typeof args.category === "string") patch.category = normalizeCategory(args.category)
    if (typeof args.isArchived === "boolean") patch.isArchived = args.isArchived

    await ctx.db.patch(args.productId, patch)
    const updated = await ctx.db.get(args.productId)
    return { ok: true, product: updated }
  },
})

export const setArchivedByIdForUser = mutationGeneric({
  args: {
    productId: v.id("products"),
    userId: v.id("users"),
    isArchived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product || product.userId !== args.userId) {
      return { ok: false, message: "Product not found" as const }
    }

    const subscriptionCheck = await hasActiveSubscription(ctx, args.userId)
    if (!subscriptionCheck.ok) {
      return { ok: false, message: subscriptionCheck.message, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    await ctx.db.patch(args.productId, {
      isArchived: args.isArchived,
      updatedAt: Date.now(),
    })

    return { ok: true }
  },
})

export const duplicateByIdForUser = mutationGeneric({
  args: {
    productId: v.id("products"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product || product.userId !== args.userId) {
      return { ok: false, message: "Product not found" as const }
    }

    const subscriptionCheck = await hasActiveSubscription(ctx, args.userId)
    if (!subscriptionCheck.ok) {
      return { ok: false, message: subscriptionCheck.message, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    const currentProductCount = await countProductsForUser(ctx, args.userId)
    if (currentProductCount >= PRODUCT_LIMIT) {
      return {
        ok: false,
        message: `Product limit reached (${PRODUCT_LIMIT}).`,
        code: "PRODUCT_LIMIT_REACHED" as const,
      }
    }

    const now = Date.now()
    const duplicatedId = await ctx.db.insert("products", {
      userId: product.userId,
      title: `${product.title} (Copy)`,
      description: product.description,
      affiliateUrl: product.affiliateUrl,
      images: product.images,
      videoUrl: product.videoUrl || "",
      category: normalizeCategory(product.category),
      isArchived: true,
      isLinkHealthy: product.isLinkHealthy ?? true,
      lastLinkCheckAt: product.lastLinkCheckAt,
      lastLinkStatus: product.lastLinkStatus,
      lastLinkError: product.lastLinkError || "",
      linkFailureCount: product.linkFailureCount ?? 0,
      createdAt: now,
      updatedAt: now,
    })

    const duplicated = await ctx.db.get(duplicatedId)
    return { ok: true, product: duplicated }
  },
})

export const setLinkHealthById = mutationGeneric({
  args: {
    productId: v.id("products"),
    isHealthy: v.boolean(),
    status: v.optional(v.number()),
    error: v.optional(v.string()),
    checkedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return { ok: false, message: "Product not found" as const }
    }

    const previousFailureCount = product.linkFailureCount ?? 0
    const nextFailureCount = args.isHealthy ? 0 : previousFailureCount + 1
    const definitiveBroken = args.status === 404 || args.status === 410 || args.status === 451
    const shouldMarkBroken = definitiveBroken || nextFailureCount >= 3

    const nextIsLinkHealthy = args.isHealthy ? true : shouldMarkBroken ? false : (product.isLinkHealthy ?? true)

    await ctx.db.patch(args.productId, {
      isLinkHealthy: nextIsLinkHealthy,
      lastLinkCheckAt: args.checkedAt ?? Date.now(),
      lastLinkStatus: args.status,
      lastLinkError: args.error || "",
      linkFailureCount: nextFailureCount,
      updatedAt: Date.now(),
    })

    return { ok: true }
  },
})

export const listHealthCheckCandidates = queryGeneric({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db.query("products").collect()
    const activeProducts = docs.filter((product) => product.isArchived !== true)

    const sorted = [...activeProducts].sort((a, b) => {
      const aTs = a.lastLinkCheckAt ?? 0
      const bTs = b.lastLinkCheckAt ?? 0
      if (aTs === bTs) {
        return a.createdAt - b.createdAt
      }
      return aTs - bTs
    })

    const limit = Math.max(1, Math.min(args.limit ?? 100, 250))
    return sorted.slice(0, limit)
  },
})

export const deleteByIdForUser = mutationGeneric({
  args: {
    productId: v.id("products"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product || product.userId !== args.userId) {
      return { ok: false, message: "Product not found" as const }
    }

    const subscriptionCheck = await hasActiveSubscription(ctx, args.userId)
    if (!subscriptionCheck.ok) {
      return { ok: false, message: subscriptionCheck.message, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    await ctx.db.delete(args.productId)
    return { ok: true }
  },
})
