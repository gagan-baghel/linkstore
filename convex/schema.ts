import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    image: v.optional(v.string()),
    storeBio: v.string(),
    storeBannerText: v.string(),
    contactInfo: v.string(),
    storeLogo: v.string(),
    socialFacebook: v.string(),
    socialTwitter: v.string(),
    socialInstagram: v.string(),
    socialYoutube: v.string(),
    socialWebsite: v.string(),
    themePrimaryColor: v.optional(v.string()),
    themeAccentColor: v.optional(v.string()),
    themeBannerStyle: v.optional(v.string()),
    themeButtonStyle: v.optional(v.string()),
    themeCardStyle: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),
  products: defineTable({
    title: v.string(),
    description: v.string(),
    affiliateUrl: v.string(),
    images: v.array(v.string()),
    videoUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    isLinkHealthy: v.optional(v.boolean()),
    lastLinkCheckAt: v.optional(v.number()),
    lastLinkStatus: v.optional(v.number()),
    lastLinkError: v.optional(v.string()),
    linkFailureCount: v.optional(v.number()),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_archived", ["userId", "isArchived"])
    .index("by_userId_category", ["userId", "category"]),
  clicks: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_productId", ["productId"]),
  events: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_eventType_createdAt", ["userId", "eventType", "createdAt"])
    .index("by_storeUsername_createdAt", ["storeUsername", "createdAt"]),
})
