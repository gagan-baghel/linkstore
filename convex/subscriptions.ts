import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

const PLAN_CODE = "starter_monthly_149"
const PLAN_AMOUNT_PAISE = 14900
const PLAN_CURRENCY = "INR"
const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000
const PRODUCT_LIMIT = 200

type EffectiveStatus = "inactive" | "pending" | "active" | "expired" | "cancelled"

type SubscriptionDoc = any
type SubscriptionResolution = {
  subscription: SubscriptionDoc | null
  ambiguous: boolean
}

function getEffectiveStatus(subscription: SubscriptionDoc | null, now: number): EffectiveStatus {
  if (!subscription) return "inactive"

  if (subscription.status === "active") {
    const expiresAt = typeof subscription.expiresAt === "number" ? subscription.expiresAt : 0
    if (expiresAt > now) return "active"
    return "expired"
  }

  if (subscription.status === "pending") {
    const expiresAt = typeof subscription.expiresAt === "number" ? subscription.expiresAt : 0
    if (expiresAt > now) return "pending"
    return "inactive"
  }

  if (subscription.status === "cancelled") return "cancelled"
  if (subscription.status === "expired") return "expired"

  return "inactive"
}

async function writeAudit(
  ctx: any,
  input: {
    actorType: "system" | "user" | "admin" | "webhook"
    actorUserId?: string
    action: string
    resourceType: string
    resourceId?: string
    status: string
    details?: string
  },
) {
  await ctx.db.insert("auditLogs", {
    actorType: input.actorType,
    actorUserId: input.actorUserId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    status: input.status,
    ip: "",
    userAgent: "",
    details: input.details || "",
    createdAt: Date.now(),
  })
}

async function resolveSingleSubscription(ctx: any, userId: string): Promise<SubscriptionResolution> {
  const rows = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect()

  if (rows.length === 0) {
    return { subscription: null, ambiguous: false }
  }

  if (rows.length === 1) {
    return { subscription: rows[0], ambiguous: false }
  }

  const sorted = [...rows].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  return { subscription: sorted[0] || null, ambiguous: true }
}

async function ensureSubscriptionRow(ctx: any, userId: string, now: number): Promise<SubscriptionResolution> {
  const resolved = await resolveSingleSubscription(ctx, userId)
  if (resolved.ambiguous || resolved.subscription) return resolved

  const insertedId = await ctx.db.insert("subscriptions", {
    userId,
    planCode: PLAN_CODE,
    planAmountPaise: PLAN_AMOUNT_PAISE,
    currency: PLAN_CURRENCY,
    status: "inactive",
    currentPeriodStart: undefined,
    currentPeriodEnd: undefined,
    activatedAt: undefined,
    expiresAt: undefined,
    cancelledAt: undefined,
    pendingOrderId: undefined,
    lastOrderId: undefined,
    lastPaymentIdEncrypted: undefined,
    lastPaymentIdHash: "",
    lastSignatureHash: "",
    webhookConfirmedAt: undefined,
    deactivationReason: undefined,
    createdAt: now,
    updatedAt: now,
  })

  const inserted = await ctx.db.get(insertedId)
  return { subscription: inserted, ambiguous: false }
}

function makeAccessState(input: {
  userExists: boolean
  ambiguous: boolean
  subscription: SubscriptionDoc | null
  effectiveStatus: EffectiveStatus
  productCount: number
  storeEnabled: boolean
  now: number
}) {
  const expiresAt = typeof input.subscription?.expiresAt === "number" ? input.subscription.expiresAt : null
  const hasActiveSubscription = input.userExists && !input.ambiguous && input.effectiveStatus === "active"
  const remainingProductSlots = Math.max(PRODUCT_LIMIT - input.productCount, 0)

  const reason = !input.userExists
    ? "User not found"
    : input.ambiguous
      ? "Subscription state is ambiguous"
      : input.effectiveStatus === "active"
        ? "Active"
        : input.effectiveStatus === "pending"
          ? "Payment confirmation pending"
          : input.effectiveStatus === "expired"
            ? "Subscription expired"
            : input.effectiveStatus === "cancelled"
              ? "Subscription cancelled"
              : "No active subscription"

  return {
    status: (input.subscription?.status || "inactive") as EffectiveStatus,
    effectiveStatus: input.effectiveStatus,
    hasActiveSubscription,
    canUsePremiumActions: hasActiveSubscription,
    canAddProducts: hasActiveSubscription && remainingProductSlots > 0,
    storeEnabled: input.storeEnabled,
    productLimit: PRODUCT_LIMIT,
    currentProductCount: input.productCount,
    remainingProductSlots,
    expiresAt,
    ambiguous: input.ambiguous,
    reason,
    evaluatedAt: input.now,
  }
}

async function computeAccessState(ctx: any, userId: string) {
  const now = Date.now()
  const user = await ctx.db.get(userId)
  if (!user) {
    return makeAccessState({
      userExists: false,
      ambiguous: false,
      subscription: null,
      effectiveStatus: "inactive",
      productCount: 0,
      storeEnabled: false,
      now,
    })
  }

  const resolved = await resolveSingleSubscription(ctx, userId)
  const productCount = (
    await ctx.db
      .query("products")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .collect()
  ).length
  const effective = getEffectiveStatus(resolved.subscription, now)

  return makeAccessState({
    userExists: true,
    ambiguous: resolved.ambiguous,
    subscription: resolved.subscription,
    effectiveStatus: effective,
    productCount,
    storeEnabled: user.storeEnabled === true,
    now,
  })
}

async function applyCapturedPayment(
  ctx: any,
  input: {
    userId: string
    razorpayOrderId: string
    paymentIdEncrypted: string
    paymentIdHash: string
    signatureHash: string
    amountPaise: number
    currency: string
    capturedAt: number
    source: "verify" | "webhook"
  },
) {
  const now = Date.now()

  const user = await ctx.db.get(input.userId)
  if (!user) {
    return { ok: false, message: "User not found", code: "USER_NOT_FOUND" as const }
  }

  const order = await ctx.db
    .query("subscriptionOrders")
    .withIndex("by_razorpayOrderId", (q: any) => q.eq("razorpayOrderId", input.razorpayOrderId))
    .first()

  if (!order || order.userId !== input.userId) {
    return { ok: false, message: "Order not found", code: "ORDER_NOT_FOUND" as const }
  }

  if (order.amountPaise !== input.amountPaise || order.currency !== input.currency) {
    return { ok: false, message: "Payment amount mismatch", code: "AMOUNT_MISMATCH" as const }
  }

  const existingPaymentRows = await ctx.db
    .query("subscriptionOrders")
    .withIndex("by_payment_hash", (q: any) => q.eq("razorpayPaymentIdHash", input.paymentIdHash))
    .collect()

  const conflicting = existingPaymentRows.find(
    (row: any) => row._id !== order._id && (row.userId !== input.userId || row.razorpayOrderId !== input.razorpayOrderId),
  )
  if (conflicting) {
    return { ok: false, message: "Payment is already linked to a different order", code: "PAYMENT_CONFLICT" as const }
  }

  if (order.status === "paid") {
    if (order.razorpayPaymentIdHash === input.paymentIdHash) {
      const resolvedExisting = await resolveSingleSubscription(ctx, input.userId)
      const existingEffective = getEffectiveStatus(resolvedExisting.subscription, now)
      return {
        ok: true,
        idempotent: true,
        subscription: resolvedExisting.subscription,
        effectiveStatus: existingEffective,
        expiresAt: resolvedExisting.subscription?.expiresAt || null,
      }
    }

    return { ok: false, message: "Order is already settled with a different payment", code: "ORDER_ALREADY_PAID" as const }
  }

  const resolved = await ensureSubscriptionRow(ctx, input.userId, now)
  if (resolved.ambiguous || !resolved.subscription) {
    return { ok: false, message: "Ambiguous subscription state", code: "AMBIGUOUS_SUBSCRIPTION" as const }
  }

  const effectiveBefore = getEffectiveStatus(resolved.subscription, now)
  const baseStart =
    effectiveBefore === "active" && typeof resolved.subscription.expiresAt === "number" && resolved.subscription.expiresAt > input.capturedAt
      ? resolved.subscription.expiresAt
      : input.capturedAt
  const expiresAt = baseStart + SUBSCRIPTION_DURATION_MS

  await ctx.db.patch(order._id, {
    status: "paid",
    razorpayPaymentIdEncrypted: input.paymentIdEncrypted,
    razorpayPaymentIdHash: input.paymentIdHash,
    signatureHash: input.signatureHash,
    providerPaymentStatus: "captured",
    paidAt: input.capturedAt,
    updatedAt: now,
  })

  await ctx.db.patch(resolved.subscription._id, {
    planCode: PLAN_CODE,
    planAmountPaise: PLAN_AMOUNT_PAISE,
    currency: PLAN_CURRENCY,
    status: "active",
    currentPeriodStart: baseStart,
    currentPeriodEnd: expiresAt,
    activatedAt: now,
    expiresAt,
    cancelledAt: undefined,
    pendingOrderId: undefined,
    lastOrderId: input.razorpayOrderId,
    lastPaymentIdEncrypted: input.paymentIdEncrypted,
    lastPaymentIdHash: input.paymentIdHash,
    lastSignatureHash: input.signatureHash,
    webhookConfirmedAt: input.source === "webhook" ? now : resolved.subscription.webhookConfirmedAt,
    deactivationReason: undefined,
    updatedAt: now,
  })

  await ctx.db.patch(user._id, {
    storeEnabled: true,
    storeCreatedAt: user.storeCreatedAt || now,
    updatedAt: now,
  })

  await writeAudit(ctx, {
    actorType: input.source === "webhook" ? "webhook" : "user",
    actorUserId: input.userId,
    action: "subscription.payment_confirmed",
    resourceType: "subscription",
    resourceId: resolved.subscription._id,
    status: "ok",
    details: JSON.stringify({
      source: input.source,
      orderId: input.razorpayOrderId,
      expiresAt,
    }),
  })

  const updatedSub = await ctx.db.get(resolved.subscription._id)
  const effective = getEffectiveStatus(updatedSub, now)

  return {
    ok: true,
    idempotent: false,
    subscription: updatedSub,
    effectiveStatus: effective,
    expiresAt: updatedSub?.expiresAt || null,
  }
}

export const getPlan = queryGeneric({
  args: {},
  handler: async () => {
    return {
      code: PLAN_CODE,
      amountPaise: PLAN_AMOUNT_PAISE,
      currency: PLAN_CURRENCY,
      durationMs: SUBSCRIPTION_DURATION_MS,
      productLimit: PRODUCT_LIMIT,
    }
  },
})

export const getAccessState = queryGeneric({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return computeAccessState(ctx, args.userId)
  },
})

export const getReusablePendingOrder = queryGeneric({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const rows = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_userId_createdAt", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    const reusable = rows.find(
      (row: any) =>
        row.status === "pending" &&
        typeof row.expiresAt === "number" &&
        row.expiresAt > now &&
        row.amountPaise === PLAN_AMOUNT_PAISE &&
        row.currency === PLAN_CURRENCY,
    )

    if (!reusable) return null

    return {
      razorpayOrderId: reusable.razorpayOrderId,
      amountPaise: reusable.amountPaise,
      currency: reusable.currency,
      expiresAt: reusable.expiresAt,
      createdAt: reusable.createdAt,
    }
  },
})

export const createCheckoutOrderRecord = mutationGeneric({
  args: {
    userId: v.id("users"),
    razorpayOrderId: v.string(),
    amountPaise: v.number(),
    currency: v.string(),
    receipt: v.string(),
    idempotencyKey: v.string(),
    pendingTtlMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const, code: "USER_NOT_FOUND" as const }
    }

    const existingSubState = await resolveSingleSubscription(ctx, args.userId)
    if (existingSubState.ambiguous) {
      return { ok: false, message: "Ambiguous subscription state" as const, code: "AMBIGUOUS_SUBSCRIPTION" as const }
    }

    if (args.amountPaise !== PLAN_AMOUNT_PAISE || args.currency !== PLAN_CURRENCY) {
      return { ok: false, message: "Invalid plan amount/currency" as const, code: "PLAN_MISMATCH" as const }
    }

    const existingByKey = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_idempotencyKey", (q: any) => q.eq("idempotencyKey", args.idempotencyKey))
      .first()

    if (existingByKey) {
      if (existingByKey.userId !== args.userId) {
        return { ok: false, message: "Idempotency key collision" as const, code: "IDEMPOTENCY_CONFLICT" as const }
      }

      return {
        ok: true,
        reused: true,
        order: {
          razorpayOrderId: existingByKey.razorpayOrderId,
          status: existingByKey.status,
          amountPaise: existingByKey.amountPaise,
          currency: existingByKey.currency,
        },
      }
    }

    const existingByRazorpayOrderId = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_razorpayOrderId", (q: any) => q.eq("razorpayOrderId", args.razorpayOrderId))
      .first()

    if (existingByRazorpayOrderId) {
      if (existingByRazorpayOrderId.userId !== args.userId) {
        return { ok: false, message: "Order already linked to another user" as const, code: "ORDER_CONFLICT" as const }
      }

      return {
        ok: true,
        reused: true,
        order: {
          razorpayOrderId: existingByRazorpayOrderId.razorpayOrderId,
          status: existingByRazorpayOrderId.status,
          amountPaise: existingByRazorpayOrderId.amountPaise,
          currency: existingByRazorpayOrderId.currency,
        },
      }
    }

    const orderExpiry = now + Math.max(60_000, Math.min(args.pendingTtlMs ?? 15 * 60 * 1000, 60 * 60 * 1000))

    await ctx.db.insert("subscriptionOrders", {
      userId: args.userId,
      planCode: PLAN_CODE,
      amountPaise: args.amountPaise,
      currency: args.currency,
      status: "pending",
      idempotencyKey: args.idempotencyKey,
      receipt: args.receipt,
      razorpayOrderId: args.razorpayOrderId,
      razorpayPaymentIdEncrypted: undefined,
      razorpayPaymentIdHash: "",
      signatureHash: "",
      providerPaymentStatus: "created",
      failureCode: undefined,
      failureReason: undefined,
      createdAt: now,
      updatedAt: now,
      expiresAt: orderExpiry,
      paidAt: undefined,
      refundedAt: undefined,
    })

    const resolved = await ensureSubscriptionRow(ctx, args.userId, now)
    if (resolved.subscription && !resolved.ambiguous) {
      const effective = getEffectiveStatus(resolved.subscription, now)
      if (effective !== "active") {
        await ctx.db.patch(resolved.subscription._id, {
          status: "pending",
          pendingOrderId: args.razorpayOrderId,
          updatedAt: now,
          expiresAt:
            typeof resolved.subscription.expiresAt === "number" && resolved.subscription.expiresAt > orderExpiry
              ? resolved.subscription.expiresAt
              : orderExpiry,
        })
      }
    }

    await writeAudit(ctx, {
      actorType: "user",
      actorUserId: args.userId,
      action: "subscription.checkout_order_created",
      resourceType: "subscription_order",
      resourceId: args.razorpayOrderId,
      status: "ok",
      details: JSON.stringify({ amountPaise: args.amountPaise, currency: args.currency }),
    })

    return {
      ok: true,
      reused: false,
      order: {
        razorpayOrderId: args.razorpayOrderId,
        status: "pending",
        amountPaise: args.amountPaise,
        currency: args.currency,
      },
    }
  },
})

export const confirmPayment = mutationGeneric({
  args: {
    userId: v.id("users"),
    razorpayOrderId: v.string(),
    paymentIdEncrypted: v.string(),
    paymentIdHash: v.string(),
    signatureHash: v.string(),
    amountPaise: v.number(),
    currency: v.string(),
    capturedAt: v.number(),
    source: v.union(v.literal("verify"), v.literal("webhook")),
    eventKey: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const existingEvent = await ctx.db
      .query("billingEvents")
      .withIndex("by_eventKey", (q: any) => q.eq("eventKey", args.eventKey))
      .first()

    if (existingEvent && existingEvent.status !== "failed") {
      const state = await computeAccessState(ctx, args.userId)
      return {
        ok: true,
        idempotent: true,
        message: "Event already processed",
        access: state,
      }
    }

    const confirmed = await applyCapturedPayment(ctx, {
      userId: args.userId,
      razorpayOrderId: args.razorpayOrderId,
      paymentIdEncrypted: args.paymentIdEncrypted,
      paymentIdHash: args.paymentIdHash,
      signatureHash: args.signatureHash,
      amountPaise: args.amountPaise,
      currency: args.currency,
      capturedAt: args.capturedAt,
      source: args.source,
    })

    if (!confirmed.ok) {
      if (existingEvent) {
        await ctx.db.patch(existingEvent._id, {
          eventType: `payment.${args.source}`,
          status: "failed",
          userId: args.userId,
          orderId: args.razorpayOrderId,
          paymentHash: args.paymentIdHash,
          payloadHash: "",
          reason: confirmed.message,
          updatedAt: now,
          processedAt: now,
        })
      } else {
        await ctx.db.insert("billingEvents", {
          provider: "razorpay",
          eventKey: args.eventKey,
          eventType: `payment.${args.source}`,
          status: "failed",
          userId: args.userId,
          orderId: args.razorpayOrderId,
          paymentHash: args.paymentIdHash,
          payloadHash: "",
          reason: confirmed.message,
          createdAt: now,
          updatedAt: now,
          processedAt: now,
        })
      }

      return {
        ok: false,
        message: confirmed.message,
        code: confirmed.code,
      }
    }

    if (existingEvent) {
      await ctx.db.patch(existingEvent._id, {
        eventType: `payment.${args.source}`,
        status: "processed",
        userId: args.userId,
        orderId: args.razorpayOrderId,
        paymentHash: args.paymentIdHash,
        payloadHash: "",
        reason: confirmed.idempotent ? "idempotent" : "",
        updatedAt: now,
        processedAt: now,
      })
    } else {
      await ctx.db.insert("billingEvents", {
        provider: "razorpay",
        eventKey: args.eventKey,
        eventType: `payment.${args.source}`,
        status: "processed",
        userId: args.userId,
        orderId: args.razorpayOrderId,
        paymentHash: args.paymentIdHash,
        payloadHash: "",
        reason: confirmed.idempotent ? "idempotent" : "",
        createdAt: now,
        updatedAt: now,
        processedAt: now,
      })
    }

    const access = await computeAccessState(ctx, args.userId)

    return {
      ok: true,
      idempotent: confirmed.idempotent,
      message: "Payment confirmed",
      expiresAt: confirmed.expiresAt,
      access,
    }
  },
})

export const processWebhookEvent = mutationGeneric({
  args: {
    eventKey: v.string(),
    eventType: v.string(),
    payloadHash: v.string(),
    razorpayOrderId: v.optional(v.string()),
    paymentIdEncrypted: v.optional(v.string()),
    paymentIdHash: v.optional(v.string()),
    signatureHash: v.optional(v.string()),
    amountPaise: v.optional(v.number()),
    currency: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    capturedAt: v.optional(v.number()),
    failureCode: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const existing = await ctx.db
      .query("billingEvents")
      .withIndex("by_eventKey", (q: any) => q.eq("eventKey", args.eventKey))
      .first()

    if (existing && existing.status !== "failed") {
      return { ok: true, idempotent: true, message: "Webhook already processed" as const }
    }

    const eventType = args.eventType.trim().toLowerCase()
    const paymentHash = args.paymentIdHash || ""

    const saveEvent = async (status: "processed" | "ignored" | "failed", reason: string, userId?: string) => {
      if (existing) {
        await ctx.db.patch(existing._id, {
          provider: "razorpay",
          eventType: args.eventType,
          status,
          userId,
          orderId: args.razorpayOrderId,
          paymentHash,
          payloadHash: args.payloadHash,
          reason,
          updatedAt: now,
          processedAt: now,
        })
        return
      }

      await ctx.db.insert("billingEvents", {
        provider: "razorpay",
        eventKey: args.eventKey,
        eventType: args.eventType,
        status,
        userId,
        orderId: args.razorpayOrderId,
        paymentHash,
        payloadHash: args.payloadHash,
        reason,
        createdAt: now,
        updatedAt: now,
        processedAt: now,
      })
    }

    const findOrder = async () => {
      if (args.razorpayOrderId) {
        return await ctx.db
          .query("subscriptionOrders")
          .withIndex("by_razorpayOrderId", (q: any) => q.eq("razorpayOrderId", args.razorpayOrderId))
          .first()
      }

      if (paymentHash) {
        const rows = await ctx.db
          .query("subscriptionOrders")
          .withIndex("by_payment_hash", (q: any) => q.eq("razorpayPaymentIdHash", paymentHash))
          .collect()
        return rows[0] || null
      }

      return null
    }

    if (eventType === "payment.captured") {
      if (!args.razorpayOrderId || !args.paymentIdEncrypted || !args.paymentIdHash || !args.amountPaise || !args.currency) {
        await saveEvent("failed", "Missing required payment capture fields")
        return { ok: false, message: "Invalid payment capture payload" as const }
      }

      const order = await findOrder()
      if (!order) {
        await saveEvent("ignored", "Order not found for captured payment")
        return { ok: true, message: "Ignored unknown order" as const }
      }

      const confirmed = await applyCapturedPayment(ctx, {
        userId: order.userId,
        razorpayOrderId: args.razorpayOrderId,
        paymentIdEncrypted: args.paymentIdEncrypted,
        paymentIdHash: args.paymentIdHash,
        signatureHash: args.signatureHash || "",
        amountPaise: args.amountPaise,
        currency: args.currency,
        capturedAt: args.capturedAt || now,
        source: "webhook",
      })

      if (!confirmed.ok) {
        const failureMessage = confirmed.message || "Payment confirmation failed"
        await saveEvent("failed", failureMessage, order.userId)
        return { ok: false, message: failureMessage }
      }

      await saveEvent("processed", confirmed.idempotent ? "idempotent" : "captured", order.userId)
      return { ok: true, message: "Captured payment processed" as const, idempotent: confirmed.idempotent }
    }

    if (eventType === "payment.failed") {
      const order = await findOrder()
      if (!order) {
        await saveEvent("ignored", "Order not found for failed payment")
        return { ok: true, message: "Ignored unknown order" as const }
      }

      if (order.status === "paid") {
        await saveEvent("ignored", "Ignored failed event for already paid order", order.userId)
        return { ok: true, message: "Ignored stale failed event" as const }
      }

      await ctx.db.patch(order._id, {
        status: "failed",
        providerPaymentStatus: args.paymentStatus || "failed",
        failureCode: args.failureCode || "",
        failureReason: args.failureReason || "Payment failed",
        updatedAt: now,
      })

      await saveEvent("processed", "failed", order.userId)
      return { ok: true, message: "Failed payment recorded" as const }
    }

    if (
      eventType === "payment.refunded" ||
      eventType === "refund.processed" ||
      eventType.startsWith("payment.dispute")
    ) {
      const order = await findOrder()
      if (!order) {
        await saveEvent("ignored", "Order not found for refund/dispute")
        return { ok: true, message: "Ignored unknown order" as const }
      }

      const nextStatus = eventType.startsWith("payment.dispute") ? "chargeback" : "refunded"

      await ctx.db.patch(order._id, {
        status: nextStatus,
        providerPaymentStatus: args.paymentStatus || nextStatus,
        refundedAt: now,
        updatedAt: now,
      })

      const resolved = await resolveSingleSubscription(ctx, order.userId)
      if (!resolved.ambiguous && resolved.subscription) {
        await ctx.db.patch(resolved.subscription._id, {
          status: "cancelled",
          cancelledAt: now,
          deactivationReason: nextStatus,
          updatedAt: now,
        })
      }

      await writeAudit(ctx, {
        actorType: "webhook",
        actorUserId: order.userId,
        action: "subscription.deactivated",
        resourceType: "subscription",
        status: "ok",
        details: JSON.stringify({ reason: nextStatus, orderId: order.razorpayOrderId }),
      })

      await saveEvent("processed", nextStatus, order.userId)
      return { ok: true, message: "Refund/dispute processed" as const }
    }

    await saveEvent("ignored", "Unhandled webhook type")
    return { ok: true, message: "Webhook type ignored" as const }
  },
})

export const expireDueSubscriptions = mutationGeneric({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const limit = Math.max(1, Math.min(args.limit ?? 200, 1000))

    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_status_expiresAt", (q: any) => q.eq("status", "active"))
      .collect()

    const due = rows.filter((row: any) => typeof row.expiresAt === "number" && row.expiresAt <= now).slice(0, limit)

    for (const sub of due) {
      await ctx.db.patch(sub._id, {
        status: "expired",
        deactivationReason: "time_elapsed",
        updatedAt: now,
      })

      await writeAudit(ctx, {
        actorType: "system",
        actorUserId: sub.userId,
        action: "subscription.expired",
        resourceType: "subscription",
        resourceId: sub._id,
        status: "ok",
        details: JSON.stringify({ expiresAt: sub.expiresAt }),
      })
    }

    return { ok: true, expired: due.length }
  },
})

export const adminOverride = mutationGeneric({
  args: {
    adminUserId: v.id("users"),
    targetUserId: v.id("users"),
    action: v.union(v.literal("cancel"), v.literal("reactivate"), v.literal("extend30"), v.literal("expire")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const adminUser = await ctx.db.get(args.adminUserId)
    if (!adminUser || adminUser.role !== "admin") {
      return { ok: false, message: "Forbidden" as const }
    }

    const targetUser = await ctx.db.get(args.targetUserId)
    if (!targetUser) {
      return { ok: false, message: "Target user not found" as const }
    }

    const resolved = await ensureSubscriptionRow(ctx, args.targetUserId, now)
    if (resolved.ambiguous || !resolved.subscription) {
      return { ok: false, message: "Ambiguous subscription state" as const }
    }

    const currentExpiry = typeof resolved.subscription.expiresAt === "number" ? resolved.subscription.expiresAt : now
    const nextStart = currentExpiry > now ? currentExpiry : now
    const nextExpiry = nextStart + SUBSCRIPTION_DURATION_MS

    if (args.action === "cancel") {
      await ctx.db.patch(resolved.subscription._id, {
        status: "cancelled",
        cancelledAt: now,
        deactivationReason: args.reason || "manual_cancel",
        updatedAt: now,
      })
    } else if (args.action === "expire") {
      await ctx.db.patch(resolved.subscription._id, {
        status: "expired",
        expiresAt: now,
        deactivationReason: args.reason || "manual_expire",
        updatedAt: now,
      })
    } else if (args.action === "reactivate") {
      await ctx.db.patch(resolved.subscription._id, {
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: now + SUBSCRIPTION_DURATION_MS,
        activatedAt: now,
        expiresAt: now + SUBSCRIPTION_DURATION_MS,
        cancelledAt: undefined,
        deactivationReason: args.reason || "manual_reactivate",
        updatedAt: now,
      })

      await ctx.db.patch(targetUser._id, {
        storeEnabled: true,
        storeCreatedAt: targetUser.storeCreatedAt || now,
        updatedAt: now,
      })
    } else {
      await ctx.db.patch(resolved.subscription._id, {
        status: "active",
        currentPeriodStart: nextStart,
        currentPeriodEnd: nextExpiry,
        activatedAt: now,
        expiresAt: nextExpiry,
        cancelledAt: undefined,
        deactivationReason: args.reason || "manual_extend",
        updatedAt: now,
      })

      await ctx.db.patch(targetUser._id, {
        storeEnabled: true,
        storeCreatedAt: targetUser.storeCreatedAt || now,
        updatedAt: now,
      })
    }

    await writeAudit(ctx, {
      actorType: "admin",
      actorUserId: args.adminUserId,
      action: `subscription.admin_${args.action}`,
      resourceType: "subscription",
      resourceId: resolved.subscription._id,
      status: "ok",
      details: JSON.stringify({ targetUserId: args.targetUserId, reason: args.reason || "" }),
    })

    const access = await computeAccessState(ctx, args.targetUserId)
    return { ok: true, access }
  },
})
