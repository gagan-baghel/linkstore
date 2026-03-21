import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.string(),
    email: v.string(),
    googleSub: v.optional(v.string()),
    authProvider: v.optional(v.union(v.literal("google"))),
    emailVerified: v.optional(v.boolean()),
    passwordHash: v.optional(v.string()),
    authVersion: v.optional(v.number()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    image: v.optional(v.string()),
    storeEnabled: v.optional(v.boolean()),
    storeCreatedAt: v.optional(v.number()),
    storeBio: v.string(),
    storeBannerText: v.string(),
    contactInfo: v.string(),
    storeLogo: v.string(),
    themePrimaryColor: v.optional(v.string()),
    themeAccentColor: v.optional(v.string()),
    themeBannerStyle: v.optional(v.string()),
    themeButtonStyle: v.optional(v.string()),
    themeCardStyle: v.optional(v.string()),
    themeMode: v.optional(v.string()),
    socialFacebook: v.string(),
    socialTwitter: v.string(),
    socialInstagram: v.string(),
    socialYoutube: v.string(),
    socialWebsite: v.string(),
    socialWhatsapp: v.optional(v.string()),
    socialWhatsappMessage: v.optional(v.string()),
    leadCaptureChannel: v.optional(v.union(v.literal("email"), v.literal("whatsapp"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_googleSub", ["googleSub"])
    .index("by_username", ["username"]),
  subscriptions: defineTable({
    userId: v.id("users"),
    planCode: v.string(),
    planAmountPaise: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("inactive"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled"),
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    pendingOrderId: v.optional(v.string()),
    lastOrderId: v.optional(v.string()),
    lastPaymentIdEncrypted: v.optional(v.string()),
    lastPaymentIdHash: v.string(),
    lastSignatureHash: v.string(),
    webhookConfirmedAt: v.optional(v.number()),
    deactivationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status_expiresAt", ["status", "expiresAt"]),
  subscriptionOrders: defineTable({
    userId: v.id("users"),
    planCode: v.string(),
    amountPaise: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("expired"),
      v.literal("refunded"),
      v.literal("chargeback"),
    ),
    idempotencyKey: v.string(),
    receipt: v.string(),
    razorpayOrderId: v.string(),
    razorpayPaymentIdEncrypted: v.optional(v.string()),
    razorpayPaymentIdHash: v.string(),
    signatureHash: v.string(),
    providerPaymentStatus: v.string(),
    failureCode: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.number(),
    paidAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
  })
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_razorpayOrderId", ["razorpayOrderId"])
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_payment_hash", ["razorpayPaymentIdHash"])
    .index("by_createdAt", ["createdAt"]),
  couponRedemptions: defineTable({
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    couponHash: v.string(),
    grantedAt: v.number(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_couponHash", ["userId", "couponHash"])
    .index("by_couponHash_createdAt", ["couponHash", "createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
  billingEvents: defineTable({
    provider: v.string(),
    eventKey: v.string(),
    eventType: v.string(),
    status: v.union(v.literal("processed"), v.literal("ignored"), v.literal("failed")),
    userId: v.optional(v.id("users")),
    orderId: v.optional(v.string()),
    paymentHash: v.string(),
    payloadHash: v.string(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_eventKey", ["eventKey"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_paymentHash_createdAt", ["paymentHash", "createdAt"]),
  billingAlerts: defineTable({
    dedupeKey: v.string(),
    category: v.string(),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    status: v.union(v.literal("open"), v.literal("resolved")),
    userId: v.optional(v.id("users")),
    orderId: v.optional(v.string()),
    paymentHash: v.optional(v.string()),
    message: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_dedupeKey", ["dedupeKey"])
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
  billingReconciliationRuns: defineTable({
    scope: v.string(),
    status: v.union(v.literal("ok"), v.literal("warning"), v.literal("failed")),
    checkedCount: v.number(),
    reconciledCount: v.number(),
    flaggedCount: v.number(),
    details: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_createdAt", ["createdAt"]),
  auditLogs: defineTable({
    actorType: v.union(v.literal("system"), v.literal("user"), v.literal("admin"), v.literal("webhook")),
    actorUserId: v.optional(v.id("users")),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    status: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actorUserId_createdAt", ["actorUserId", "createdAt"])
    .index("by_action_createdAt", ["action", "createdAt"]),
  products: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
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
    createdAt: v.number(),
  })
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_eventType_createdAt", ["userId", "eventType", "createdAt"])
    .index("by_storeUsername_createdAt", ["storeUsername", "createdAt"])
    .index("by_productId_createdAt", ["productId", "createdAt"]),
  audienceLeads: defineTable({
    userId: v.id("users"),
    storeUsername: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    consent: v.boolean(),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("qualified"), v.literal("archived")),
    source: v.optional(v.string()),
    medium: v.optional(v.string()),
    campaign: v.optional(v.string()),
    content: v.optional(v.string()),
    term: v.optional(v.string()),
    collectionSlug: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_status_createdAt", ["userId", "status", "createdAt"])
    .index("by_storeUsername_createdAt", ["storeUsername", "createdAt"]),
})
