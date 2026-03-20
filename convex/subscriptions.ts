import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

import {
  canTransitionSubscriptionStatus,
  isCurrentSubscriptionEntitlement,
  resolveStoreEnabled,
  shouldRevokeAccessForBillingEvent,
  type SubscriptionLifecycleStatus,
} from "../lib/subscription-billing"
import { canRedeemCouponForStatus, computeSubscriptionExtensionExpiry } from "../lib/subscription-coupons"

const PLAN_CODE = "starter_monthly_149"
const PLAN_AMOUNT_PAISE = 14900
const PLAN_CURRENCY = "INR"
const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000
const PRODUCT_LIMIT = 200

type EffectiveStatus = "inactive" | "pending" | "active" | "expired" | "cancelled"
type PersistedStatus = SubscriptionLifecycleStatus

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

function canTransitionStatus(fromStatus: PersistedStatus, toStatus: PersistedStatus) {
  return canTransitionSubscriptionStatus(fromStatus, toStatus)
}

async function patchSubscriptionStatus(
  ctx: any,
  subscription: SubscriptionDoc,
  input: {
    nextStatus: PersistedStatus
    patch: Record<string, any>
  },
) {
  const currentStatus = (subscription.status || "inactive") as PersistedStatus
  if (!canTransitionStatus(currentStatus, input.nextStatus)) {
    return {
      ok: false as const,
      message: `Invalid subscription transition: ${currentStatus} -> ${input.nextStatus}`,
      code: "INVALID_STATUS_TRANSITION" as const,
    }
  }

  await ctx.db.patch(subscription._id, {
    ...input.patch,
    status: input.nextStatus,
  })

  return { ok: true as const }
}

async function upsertBillingAlert(
  ctx: any,
  input: {
    dedupeKey: string
    category: string
    severity: "critical" | "high" | "medium" | "low"
    userId?: string
    orderId?: string
    paymentHash?: string
    message: string
    details?: string
  },
) {
  const now = Date.now()
  const existing = await ctx.db
    .query("billingAlerts")
    .withIndex("by_dedupeKey", (q: any) => q.eq("dedupeKey", input.dedupeKey))
    .first()

  if (existing) {
    await ctx.db.patch(existing._id, {
      category: input.category,
      severity: input.severity,
      status: "open",
      userId: input.userId,
      orderId: input.orderId,
      paymentHash: input.paymentHash,
      message: input.message,
      details: input.details || "",
      updatedAt: now,
      resolvedAt: undefined,
    })
    return existing._id
  }

  return await ctx.db.insert("billingAlerts", {
    dedupeKey: input.dedupeKey,
    category: input.category,
    severity: input.severity,
    status: "open",
    userId: input.userId,
    orderId: input.orderId,
    paymentHash: input.paymentHash,
    message: input.message,
    details: input.details || "",
    createdAt: now,
    updatedAt: now,
    resolvedAt: undefined,
  })
}

async function resolveBillingAlertByKey(ctx: any, dedupeKey: string) {
  const existing = await ctx.db
    .query("billingAlerts")
    .withIndex("by_dedupeKey", (q: any) => q.eq("dedupeKey", dedupeKey))
    .first()

  if (!existing || existing.status === "resolved") return

  await ctx.db.patch(existing._id, {
    status: "resolved",
    updatedAt: Date.now(),
    resolvedAt: Date.now(),
  })
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
    storeEnabled: resolveStoreEnabled({
      userStoreEnabled: input.storeEnabled,
      hasActiveSubscription,
    }),
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
  const { baseStart, expiresAt } = computeSubscriptionExtensionExpiry({
    currentExpiresAt: effectiveBefore === "active" ? resolved.subscription.expiresAt : null,
    grantedAt: input.capturedAt,
    durationMs: SUBSCRIPTION_DURATION_MS,
  })

  await ctx.db.patch(order._id, {
    status: "paid",
    razorpayPaymentIdEncrypted: input.paymentIdEncrypted,
    razorpayPaymentIdHash: input.paymentIdHash,
    signatureHash: input.signatureHash,
    providerPaymentStatus: "captured",
    paidAt: input.capturedAt,
    updatedAt: now,
  })

  const activationPatch = await patchSubscriptionStatus(ctx, resolved.subscription, {
    nextStatus: "active",
    patch: {
      planCode: PLAN_CODE,
      planAmountPaise: PLAN_AMOUNT_PAISE,
      currency: PLAN_CURRENCY,
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
    },
  })
  if (!activationPatch.ok) {
    await upsertBillingAlert(ctx, {
      dedupeKey: `invalid-transition:${input.userId}:${input.razorpayOrderId}`,
      category: "subscription_state",
      severity: "critical",
      userId: input.userId,
      orderId: input.razorpayOrderId,
      paymentHash: input.paymentIdHash,
      message: activationPatch.message,
      details: JSON.stringify({ source: input.source }),
    })
    return { ok: false, message: activationPatch.message, code: activationPatch.code }
  }

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
  await resolveBillingAlertByKey(ctx, `captured-no-entitlement:${input.userId}:${input.razorpayOrderId}`)
  const effective = getEffectiveStatus(updatedSub, now)

  return {
    ok: true,
    idempotent: false,
    subscription: updatedSub,
    effectiveStatus: effective,
    expiresAt: updatedSub?.expiresAt || null,
  }
}

async function applyCouponRedemption(
  ctx: any,
  input: {
    userId: string
    codeHash: string
    codeHint: string
  },
) {
  const now = Date.now()

  const user = await ctx.db.get(input.userId)
  if (!user) {
    return { ok: false, message: "User not found", code: "USER_NOT_FOUND" as const }
  }

  const coupon = await ctx.db
    .query("subscriptionCoupons")
    .withIndex("by_codeHash", (q: any) => q.eq("codeHash", input.codeHash))
    .first()

  if (!coupon) {
    return { ok: false, message: "Coupon code is invalid.", code: "COUPON_INVALID" as const }
  }

  if (!coupon.isActive) {
    return { ok: false, message: "Coupon is no longer active.", code: "COUPON_INACTIVE" as const }
  }

  if (typeof coupon.expiresAt === "number" && coupon.expiresAt <= now) {
    return { ok: false, message: "Coupon has expired.", code: "COUPON_EXPIRED" as const }
  }

  if (typeof coupon.maxRedemptions === "number" && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { ok: false, message: "Coupon redemption limit has been reached.", code: "COUPON_EXHAUSTED" as const }
  }

  return grantCouponAccess(ctx, {
    userId: input.userId,
    codeHash: input.codeHash,
    codeHint: coupon.codeHint || input.codeHint,
    couponLabel: coupon.label,
    durationMs: coupon.durationMs || SUBSCRIPTION_DURATION_MS,
    maxRedemptions: typeof coupon.maxRedemptions === "number" ? coupon.maxRedemptions : undefined,
    expiresAt: typeof coupon.expiresAt === "number" ? coupon.expiresAt : undefined,
    source: "stored",
    couponId: coupon._id,
    incrementStoredCouponCount: true,
  })
}

async function grantCouponAccess(
  ctx: any,
  input: {
    userId: string
    codeHash: string
    codeHint: string
    couponLabel: string
    durationMs: number
    maxRedemptions?: number
    expiresAt?: number
    source: "stored" | "env"
    couponId?: string
    incrementStoredCouponCount?: boolean
  },
) {
  const now = Date.now()

  const user = await ctx.db.get(input.userId)
  if (!user) {
    return { ok: false, message: "User not found", code: "USER_NOT_FOUND" as const }
  }

  if (typeof input.expiresAt === "number" && input.expiresAt <= now) {
    return { ok: false, message: "Coupon has expired.", code: "COUPON_EXPIRED" as const }
  }

  const resolved = await ensureSubscriptionRow(ctx, input.userId, now)
  if (resolved.ambiguous || !resolved.subscription) {
    return { ok: false, message: "Ambiguous subscription state", code: "AMBIGUOUS_SUBSCRIPTION" as const }
  }

  const priorRedemption = await ctx.db
    .query("subscriptionCouponRedemptions")
    .withIndex("by_userId_codeHash", (q: any) => q.eq("userId", input.userId).eq("codeHash", input.codeHash))
    .first()

  if (priorRedemption) {
    return {
      ok: false,
      message: "You have already used this coupon.",
      code: "COUPON_ALREADY_REDEEMED" as const,
      resultingExpiresAt: priorRedemption.resultingExpiresAt,
    }
  }

  if (typeof input.maxRedemptions === "number") {
    const existingRedemptions = await ctx.db
      .query("subscriptionCouponRedemptions")
      .withIndex("by_codeHash_createdAt", (q: any) => q.eq("codeHash", input.codeHash))
      .collect()

    if (existingRedemptions.length >= input.maxRedemptions) {
      return { ok: false, message: "Coupon redemption limit has been reached.", code: "COUPON_EXHAUSTED" as const }
    }
  }

  const effectiveBefore = getEffectiveStatus(resolved.subscription, now)
  if (!canRedeemCouponForStatus(effectiveBefore)) {
    return {
      ok: false,
      message: "You already have an active subscription.",
      code: "ACTIVE_SUBSCRIPTION_EXISTS" as const,
    }
  }
  const { baseStart, expiresAt } = computeSubscriptionExtensionExpiry({
    currentExpiresAt: effectiveBefore === "active" ? resolved.subscription.expiresAt : null,
    grantedAt: now,
    durationMs: input.durationMs,
  })

  const couponPatch = await patchSubscriptionStatus(ctx, resolved.subscription, {
    nextStatus: "active",
    patch: {
      planCode: PLAN_CODE,
      planAmountPaise: PLAN_AMOUNT_PAISE,
      currency: PLAN_CURRENCY,
      currentPeriodStart: baseStart,
      currentPeriodEnd: expiresAt,
      activatedAt: now,
      expiresAt,
      cancelledAt: undefined,
      pendingOrderId: undefined,
      deactivationReason: undefined,
      updatedAt: now,
    },
  })
  if (!couponPatch.ok) {
    return { ok: false, message: couponPatch.message, code: couponPatch.code }
  }

  await ctx.db.patch(user._id, {
    storeEnabled: true,
    storeCreatedAt: user.storeCreatedAt || now,
    updatedAt: now,
  })

  if (input.incrementStoredCouponCount && input.couponId) {
    const storedCoupon = await ctx.db.get(input.couponId)
    if (storedCoupon) {
      await ctx.db.patch(storedCoupon._id, {
        redemptionCount: (storedCoupon.redemptionCount || 0) + 1,
        updatedAt: now,
      })
    }
  }

  await ctx.db.insert("subscriptionCouponRedemptions", {
    couponId: input.couponId,
    userId: input.userId,
    subscriptionId: resolved.subscription._id,
    codeHash: input.codeHash,
    codeHint: input.codeHint,
    couponLabel: input.couponLabel,
    source: input.source,
    grantedDurationMs: input.durationMs,
    grantedAt: now,
    resultingExpiresAt: expiresAt,
    createdAt: now,
    updatedAt: now,
  })

  await writeAudit(ctx, {
    actorType: "user",
    actorUserId: input.userId,
    action: "subscription.coupon_redeemed",
    resourceType: "subscription_coupon",
    resourceId: input.couponId,
    status: "ok",
    details: JSON.stringify({
      codeHint: input.codeHint,
      couponLabel: input.couponLabel,
      source: input.source,
      expiresAt,
    }),
  })

  const access = await computeAccessState(ctx, input.userId)

  return {
    ok: true as const,
    coupon: {
      id: input.couponId || "",
      codeHint: input.codeHint,
      label: input.couponLabel,
      durationMs: input.durationMs,
      maxRedemptions: typeof input.maxRedemptions === "number" ? input.maxRedemptions : null,
    },
    expiresAt,
    access,
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

export const getLatestPendingOrderForUser = queryGeneric({
  args: {
    userId: v.id("users"),
    maxAgeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const maxAgeMs = Math.max(60_000, Math.min(args.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000, 30 * 24 * 60 * 60 * 1000))
    const rows = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_userId_createdAt", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    const pending = rows.find((row: any) => row.status === "pending" && now - row.createdAt <= maxAgeMs)
    if (!pending) return null

    return {
      razorpayOrderId: pending.razorpayOrderId,
      amountPaise: pending.amountPaise,
      currency: pending.currency,
      createdAt: pending.createdAt,
      expiresAt: pending.expiresAt,
      status: pending.status,
    }
  },
})

export const getOrdersForReconciliation = queryGeneric({
  args: {
    lookbackMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const lookbackMs = Math.max(60_000, Math.min(args.lookbackMs ?? 7 * 24 * 60 * 60 * 1000, 30 * 24 * 60 * 60 * 1000))
    const limit = Math.max(1, Math.min(args.limit ?? 200, 1000))

    const rows = await ctx.db.query("subscriptionOrders").withIndex("by_createdAt").order("desc").collect()
    return rows
      .filter((row: any) => now - row.createdAt <= lookbackMs)
      .slice(0, limit)
      .map((row: any) => ({
        _id: row._id,
        userId: row.userId,
        razorpayOrderId: row.razorpayOrderId,
        amountPaise: row.amountPaise,
        currency: row.currency,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        expiresAt: row.expiresAt,
        paidAt: row.paidAt,
        refundedAt: row.refundedAt,
        razorpayPaymentIdHash: row.razorpayPaymentIdHash,
        providerPaymentStatus: row.providerPaymentStatus,
      }))
  },
})

export const getOrderByIdempotencyKey = queryGeneric({
  args: {
    userId: v.id("users"),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("subscriptionOrders")
      .withIndex("by_idempotencyKey", (q: any) => q.eq("idempotencyKey", args.idempotencyKey))
      .first()

    if (!row) return null

    return {
      conflict: row.userId !== args.userId,
      razorpayOrderId: row.razorpayOrderId,
      amountPaise: row.amountPaise,
      currency: row.currency,
      status: row.status,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      paidAt: row.paidAt,
    }
  },
})

export const expirePendingOrder = mutationGeneric({
  args: {
    orderId: v.id("subscriptionOrders"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return { ok: false, message: "Order not found" as const }
    }

    if (order.status !== "pending" || order.expiresAt > now) {
      return { ok: true, skipped: true as const }
    }

    await ctx.db.patch(order._id, {
      status: "expired",
      providerPaymentStatus: order.providerPaymentStatus || "expired",
      updatedAt: now,
    })

    const resolved = await resolveSingleSubscription(ctx, order.userId)
    if (!resolved.ambiguous && resolved.subscription?.pendingOrderId === order.razorpayOrderId) {
      if (resolved.subscription.status === "pending") {
        const patchResult = await patchSubscriptionStatus(ctx, resolved.subscription, {
          nextStatus: "inactive",
          patch: {
            pendingOrderId: undefined,
            updatedAt: now,
          },
        })
        if (!patchResult.ok) {
          await upsertBillingAlert(ctx, {
            dedupeKey: `invalid-transition:${order.userId}:${order.razorpayOrderId}:expire-pending`,
            category: "subscription_state",
            severity: "high",
            userId: order.userId,
            orderId: order.razorpayOrderId,
            paymentHash: order.razorpayPaymentIdHash,
            message: patchResult.message,
          })
        }
      } else {
        await ctx.db.patch(resolved.subscription._id, {
          pendingOrderId: undefined,
          updatedAt: now,
        })
      }
    }

    return { ok: true }
  },
})

export const recordBillingAlert = mutationGeneric({
  args: {
    dedupeKey: v.string(),
    category: v.string(),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    userId: v.optional(v.id("users")),
    orderId: v.optional(v.string()),
    paymentHash: v.optional(v.string()),
    message: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await upsertBillingAlert(ctx, args)
    return { ok: true, alertId: id }
  },
})

export const resolveBillingAlert = mutationGeneric({
  args: {
    dedupeKey: v.string(),
  },
  handler: async (ctx, args) => {
    await resolveBillingAlertByKey(ctx, args.dedupeKey)
    return { ok: true }
  },
})

export const recordBillingReconciliationRun = mutationGeneric({
  args: {
    scope: v.string(),
    status: v.union(v.literal("ok"), v.literal("warning"), v.literal("failed")),
    checkedCount: v.number(),
    reconciledCount: v.number(),
    flaggedCount: v.number(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const runId = await ctx.db.insert("billingReconciliationRuns", {
      scope: args.scope,
      status: args.status,
      checkedCount: args.checkedCount,
      reconciledCount: args.reconciledCount,
      flaggedCount: args.flaggedCount,
      details: args.details || "",
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    })
    return { ok: true, runId }
  },
})

export const getBillingHealthSummary = queryGeneric({
  args: {
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const adminUser = await ctx.db.get(args.adminUserId)
    if (!adminUser || adminUser.role !== "admin") {
      return { ok: false, message: "Forbidden" as const }
    }

    const [alerts, runs] = await Promise.all([
      ctx.db
        .query("billingAlerts")
        .withIndex("by_status_createdAt", (q: any) => q.eq("status", "open"))
        .order("desc")
        .collect(),
      ctx.db.query("billingReconciliationRuns").withIndex("by_createdAt").order("desc").collect(),
    ])

    const latestRun = runs[0] || null
    return {
      ok: true,
      openAlerts: alerts.length,
      criticalAlerts: alerts.filter((alert: any) => alert.severity === "critical").length,
      highAlerts: alerts.filter((alert: any) => alert.severity === "high").length,
      latestRun: latestRun
        ? {
            status: latestRun.status,
            checkedCount: latestRun.checkedCount,
            reconciledCount: latestRun.reconciledCount,
            flaggedCount: latestRun.flaggedCount,
            completedAt: latestRun.completedAt,
          }
        : null,
      alerts: alerts.slice(0, 20).map((alert: any) => ({
        id: alert._id,
        category: alert.category,
        severity: alert.severity,
        message: alert.message,
        orderId: alert.orderId || "",
        createdAt: alert.createdAt,
      })),
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
          pendingOrderId: args.razorpayOrderId,
          updatedAt: now,
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

export const redeemCoupon = mutationGeneric({
  args: {
    userId: v.id("users"),
    codeHash: v.string(),
    codeHint: v.string(),
  },
  handler: async (ctx, args) => {
    return applyCouponRedemption(ctx, args)
  },
})

export const redeemConfiguredCoupon = mutationGeneric({
  args: {
    userId: v.id("users"),
    codeHash: v.string(),
    codeHint: v.string(),
    couponLabel: v.string(),
    durationMs: v.number(),
    maxRedemptions: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return grantCouponAccess(ctx, {
      userId: args.userId,
      codeHash: args.codeHash,
      codeHint: args.codeHint,
      couponLabel: args.couponLabel,
      durationMs: args.durationMs,
      maxRedemptions: args.maxRedemptions,
      expiresAt: args.expiresAt,
      source: "env",
    })
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
    amountRefundedPaise: v.optional(v.number()),
    currency: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    refundStatus: v.optional(v.string()),
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

      const resolved = await resolveSingleSubscription(ctx, order.userId)
      if (!resolved.ambiguous && resolved.subscription?.pendingOrderId === order.razorpayOrderId) {
        const currentPeriodEnd =
          typeof resolved.subscription.currentPeriodEnd === "number" ? resolved.subscription.currentPeriodEnd : undefined
        const nextStatus =
          resolved.subscription.status === "pending"
            ? typeof currentPeriodEnd === "number" && currentPeriodEnd > now
              ? "active"
              : "inactive"
            : resolved.subscription.status
        if (nextStatus !== resolved.subscription.status) {
          const patchResult = await patchSubscriptionStatus(ctx, resolved.subscription, {
            nextStatus: nextStatus as PersistedStatus,
            patch: {
              pendingOrderId: undefined,
              updatedAt: now,
            },
          })
          if (!patchResult.ok) {
            await upsertBillingAlert(ctx, {
              dedupeKey: `invalid-transition:${order.userId}:${order.razorpayOrderId}:failed`,
              category: "subscription_state",
              severity: "high",
              userId: order.userId,
              orderId: order.razorpayOrderId,
              message: patchResult.message,
            })
          }
        } else {
          await ctx.db.patch(resolved.subscription._id, {
            pendingOrderId: undefined,
            updatedAt: now,
          })
        }
      }

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
      const shouldRevokeAccess = shouldRevokeAccessForBillingEvent({
        eventType,
        orderAmountPaise: order.amountPaise,
        amountRefundedPaise: args.amountRefundedPaise,
        paymentStatus: args.paymentStatus,
        refundStatus: args.refundStatus,
      })

      await ctx.db.patch(order._id, {
        status: shouldRevokeAccess ? nextStatus : order.status,
        providerPaymentStatus:
          args.paymentStatus ||
          args.refundStatus ||
          (shouldRevokeAccess ? nextStatus : "partially_refunded"),
        refundedAt: shouldRevokeAccess ? now : order.refundedAt,
        updatedAt: now,
      })

      const resolved = await resolveSingleSubscription(ctx, order.userId)
      const affectsCurrentEntitlement =
        shouldRevokeAccess &&
        !resolved.ambiguous &&
        isCurrentSubscriptionEntitlement({
          subscription: resolved.subscription,
          orderId: order.razorpayOrderId,
          paymentHash,
          now,
        })

      if (affectsCurrentEntitlement && resolved.subscription) {
        const revokeResult = await patchSubscriptionStatus(ctx, resolved.subscription, {
          nextStatus: "cancelled",
          patch: {
            cancelledAt: now,
            deactivationReason: nextStatus,
            updatedAt: now,
          },
        })
        if (!revokeResult.ok) {
          await upsertBillingAlert(ctx, {
            dedupeKey: `invalid-transition:${order.userId}:${order.razorpayOrderId}:revoke`,
            category: "subscription_state",
            severity: "critical",
            userId: order.userId,
            orderId: order.razorpayOrderId,
            paymentHash,
            message: revokeResult.message,
            details: JSON.stringify({ reason: nextStatus }),
          })
          await saveEvent("failed", revokeResult.message, order.userId)
          return { ok: false, message: revokeResult.message }
        }
      }

      const user = await ctx.db.get(order.userId)
      if (user && affectsCurrentEntitlement) {
        await ctx.db.patch(user._id, {
          storeEnabled: false,
          updatedAt: now,
        })
      }

      if (affectsCurrentEntitlement) {
        await writeAudit(ctx, {
          actorType: "webhook",
          actorUserId: order.userId,
          action: "subscription.deactivated",
          resourceType: "subscription",
          status: "ok",
          details: JSON.stringify({ reason: nextStatus, orderId: order.razorpayOrderId }),
        })
      }

      const reason = shouldRevokeAccess
        ? affectsCurrentEntitlement
          ? nextStatus
          : `${nextStatus}_historic_order_only`
        : "partial_refund_no_access_change"

      await saveEvent("processed", reason, order.userId)
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
      const expireResult = await patchSubscriptionStatus(ctx, sub, {
        nextStatus: "expired",
        patch: {
          deactivationReason: "time_elapsed",
          updatedAt: now,
        },
      })
      if (!expireResult.ok) {
        await upsertBillingAlert(ctx, {
          dedupeKey: `invalid-transition:${sub.userId}:${sub._id}:expire`,
          category: "subscription_state",
          severity: "high",
          userId: sub.userId,
          message: expireResult.message,
        })
        continue
      }

      const user = await ctx.db.get(sub.userId)
      if (user) {
        await ctx.db.patch(user._id, {
          storeEnabled: false,
          updatedAt: now,
        })
      }

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

export const createCoupon = mutationGeneric({
  args: {
    adminUserId: v.id("users"),
    codeHash: v.string(),
    codeHint: v.string(),
    label: v.string(),
    durationMs: v.number(),
    maxRedemptions: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const adminUser = await ctx.db.get(args.adminUserId)
    if (!adminUser || adminUser.role !== "admin") {
      return { ok: false, message: "Forbidden" as const, code: "FORBIDDEN" as const }
    }

    const existing = await ctx.db
      .query("subscriptionCoupons")
      .withIndex("by_codeHash", (q: any) => q.eq("codeHash", args.codeHash))
      .first()

    if (existing) {
      return { ok: false, message: "Coupon already exists" as const, code: "COUPON_EXISTS" as const }
    }

    const couponId = await ctx.db.insert("subscriptionCoupons", {
      codeHash: args.codeHash,
      codeHint: args.codeHint,
      label: args.label.trim(),
      durationMs: args.durationMs,
      isActive: true,
      maxRedemptions: args.maxRedemptions,
      redemptionCount: 0,
      expiresAt: args.expiresAt,
      note: args.note?.trim() || "",
      createdByUserId: args.adminUserId,
      deactivatedAt: undefined,
      createdAt: now,
      updatedAt: now,
    })

    await writeAudit(ctx, {
      actorType: "admin",
      actorUserId: args.adminUserId,
      action: "subscription.coupon_created",
      resourceType: "subscription_coupon",
      resourceId: couponId,
      status: "ok",
      details: JSON.stringify({
        codeHint: args.codeHint,
        maxRedemptions: typeof args.maxRedemptions === "number" ? args.maxRedemptions : null,
        expiresAt: args.expiresAt || null,
      }),
    })

    const created = await ctx.db.get(couponId)
    return {
      ok: true,
      coupon: created
        ? {
            id: created._id,
            codeHint: created.codeHint,
            label: created.label,
            durationMs: created.durationMs,
            isActive: created.isActive,
            maxRedemptions: created.maxRedemptions ?? null,
            redemptionCount: created.redemptionCount ?? 0,
            expiresAt: created.expiresAt ?? null,
            note: created.note || "",
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          }
        : null,
    }
  },
})

export const listCoupons = queryGeneric({
  args: {
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const adminUser = await ctx.db.get(args.adminUserId)
    if (!adminUser || adminUser.role !== "admin") {
      return { ok: false, message: "Forbidden" as const, coupons: [] as any[] }
    }

    const rows = await ctx.db.query("subscriptionCoupons").withIndex("by_createdAt").order("desc").collect()

    return {
      ok: true,
      coupons: rows.map((coupon: any) => ({
        id: coupon._id,
        codeHint: coupon.codeHint,
        label: coupon.label,
        durationMs: coupon.durationMs,
        isActive: coupon.isActive === true,
        maxRedemptions: typeof coupon.maxRedemptions === "number" ? coupon.maxRedemptions : null,
        redemptionCount: coupon.redemptionCount || 0,
        expiresAt: typeof coupon.expiresAt === "number" ? coupon.expiresAt : null,
        note: coupon.note || "",
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      })),
    }
  },
})

export const updateCouponStatus = mutationGeneric({
  args: {
    adminUserId: v.id("users"),
    couponId: v.id("subscriptionCoupons"),
    isActive: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const adminUser = await ctx.db.get(args.adminUserId)
    if (!adminUser || adminUser.role !== "admin") {
      return { ok: false, message: "Forbidden" as const, code: "FORBIDDEN" as const }
    }

    const coupon = await ctx.db.get(args.couponId)
    if (!coupon) {
      return { ok: false, message: "Coupon not found" as const, code: "COUPON_NOT_FOUND" as const }
    }

    await ctx.db.patch(coupon._id, {
      isActive: args.isActive,
      deactivatedAt: args.isActive ? undefined : now,
      updatedAt: now,
    })

    await writeAudit(ctx, {
      actorType: "admin",
      actorUserId: args.adminUserId,
      action: args.isActive ? "subscription.coupon_activated" : "subscription.coupon_deactivated",
      resourceType: "subscription_coupon",
      resourceId: coupon._id,
      status: "ok",
      details: JSON.stringify({
        codeHint: coupon.codeHint,
        reason: args.reason || "",
      }),
    })

    const updated = await ctx.db.get(coupon._id)
    return {
      ok: true,
      coupon: updated
        ? {
            id: updated._id,
            codeHint: updated.codeHint,
            label: updated.label,
            durationMs: updated.durationMs,
            isActive: updated.isActive === true,
            maxRedemptions: typeof updated.maxRedemptions === "number" ? updated.maxRedemptions : null,
            redemptionCount: updated.redemptionCount || 0,
            expiresAt: typeof updated.expiresAt === "number" ? updated.expiresAt : null,
            note: updated.note || "",
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          }
        : null,
    }
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
      const result = await patchSubscriptionStatus(ctx, resolved.subscription, {
        nextStatus: "cancelled",
        patch: {
          cancelledAt: now,
          deactivationReason: args.reason || "manual_cancel",
          updatedAt: now,
        },
      })
      if (!result.ok) {
        return { ok: false, message: result.message || "Invalid subscription transition" }
      }
      await ctx.db.patch(targetUser._id, {
        storeEnabled: false,
        updatedAt: now,
      })
    } else if (args.action === "expire") {
      const result = await patchSubscriptionStatus(ctx, resolved.subscription, {
        nextStatus: "expired",
        patch: {
          expiresAt: now,
          deactivationReason: args.reason || "manual_expire",
          updatedAt: now,
        },
      })
      if (!result.ok) {
        return { ok: false, message: result.message || "Invalid subscription transition" }
      }
      await ctx.db.patch(targetUser._id, {
        storeEnabled: false,
        updatedAt: now,
      })
    } else if (args.action === "reactivate") {
      const result = await patchSubscriptionStatus(ctx, resolved.subscription, {
        nextStatus: "active",
        patch: {
          currentPeriodStart: now,
          currentPeriodEnd: now + SUBSCRIPTION_DURATION_MS,
          activatedAt: now,
          expiresAt: now + SUBSCRIPTION_DURATION_MS,
          cancelledAt: undefined,
          deactivationReason: args.reason || "manual_reactivate",
          updatedAt: now,
        },
      })
      if (!result.ok) {
        return { ok: false, message: result.message || "Invalid subscription transition" }
      }

      await ctx.db.patch(targetUser._id, {
        storeEnabled: true,
        storeCreatedAt: targetUser.storeCreatedAt || now,
        updatedAt: now,
      })
    } else {
      const result = await patchSubscriptionStatus(ctx, resolved.subscription, {
        nextStatus: "active",
        patch: {
          currentPeriodStart: nextStart,
          currentPeriodEnd: nextExpiry,
          activatedAt: now,
          expiresAt: nextExpiry,
          cancelledAt: undefined,
          deactivationReason: args.reason || "manual_extend",
          updatedAt: now,
        },
      })
      if (!result.ok) {
        return { ok: false, message: result.message || "Invalid subscription transition" }
      }

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
