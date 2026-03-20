export function isSubscriptionActiveRecord(
  subscription: {
    status?: string | null
    expiresAt?: number | null
  } | null | undefined,
  now = Date.now(),
) {
  return (
    subscription?.status === "active" &&
    typeof subscription.expiresAt === "number" &&
    Number.isFinite(subscription.expiresAt) &&
    subscription.expiresAt > now
  )
}

export type SubscriptionLifecycleStatus = "inactive" | "pending" | "active" | "expired" | "cancelled"
export type SubscriptionEffectiveStatus = SubscriptionLifecycleStatus
export type SubscriptionRecordLike = {
  status?: string | null
  expiresAt?: number | null
  currentPeriodEnd?: number | null
  updatedAt?: number | null
  createdAt?: number | null
  activatedAt?: number | null
}

const ALLOWED_SUBSCRIPTION_TRANSITIONS: Record<SubscriptionLifecycleStatus, Set<SubscriptionLifecycleStatus>> = {
  inactive: new Set(["inactive", "pending", "active", "cancelled", "expired"]),
  pending: new Set(["pending", "inactive", "active", "cancelled", "expired"]),
  active: new Set(["active", "cancelled", "expired"]),
  expired: new Set(["expired", "active", "cancelled"]),
  cancelled: new Set(["cancelled", "active", "expired"]),
}

export function canTransitionSubscriptionStatus(fromStatus: SubscriptionLifecycleStatus, toStatus: SubscriptionLifecycleStatus) {
  return ALLOWED_SUBSCRIPTION_TRANSITIONS[fromStatus]?.has(toStatus) === true
}

export function getEffectiveSubscriptionStatus(
  subscription: SubscriptionRecordLike | null | undefined,
  now = Date.now(),
): SubscriptionEffectiveStatus {
  if (!subscription) return "inactive"

  if (subscription.status === "active") {
    const expiresAt = typeof subscription.expiresAt === "number" ? subscription.expiresAt : 0
    if (expiresAt > now) return "active"
    return "expired"
  }

  if (subscription.status === "pending") {
    const expiresAt = typeof subscription.expiresAt === "number" ? subscription.expiresAt : 0
    if (expiresAt > now) return "pending"

    const currentPeriodEnd = typeof subscription.currentPeriodEnd === "number" ? subscription.currentPeriodEnd : 0
    if (currentPeriodEnd > now) return "active"

    return "inactive"
  }

  if (subscription.status === "cancelled") return "cancelled"
  if (subscription.status === "expired") return "expired"

  return "inactive"
}

function getSubscriptionStatusPriority(subscription: SubscriptionRecordLike | null | undefined, now = Date.now()) {
  const effectiveStatus = getEffectiveSubscriptionStatus(subscription, now)

  switch (effectiveStatus) {
    case "active":
      return 5
    case "pending":
      return 4
    case "expired":
      return 3
    case "cancelled":
      return 2
    default:
      return 1
  }
}

export function pickCanonicalSubscription<T extends SubscriptionRecordLike>(subscriptions: T[], now = Date.now()): T | null {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return null
  }

  const sorted = [...subscriptions].sort((left, right) => {
    const priorityDelta = getSubscriptionStatusPriority(right, now) - getSubscriptionStatusPriority(left, now)
    if (priorityDelta !== 0) return priorityDelta

    const updatedDelta = (right.updatedAt || 0) - (left.updatedAt || 0)
    if (updatedDelta !== 0) return updatedDelta

    const activatedDelta = (right.activatedAt || 0) - (left.activatedAt || 0)
    if (activatedDelta !== 0) return activatedDelta

    return (right.createdAt || 0) - (left.createdAt || 0)
  })

  return sorted[0] || null
}

export function resolveStoreEnabled(input: {
  userStoreEnabled?: boolean | null
  hasActiveSubscription?: boolean | null
}) {
  return input.userStoreEnabled === true && input.hasActiveSubscription === true
}

export function isCurrentSubscriptionEntitlement(input: {
  subscription?: {
    status?: string | null
    expiresAt?: number | null
    lastOrderId?: string | null
    lastPaymentIdHash?: string | null
  } | null
  orderId?: string | null
  paymentHash?: string | null
  now?: number
}) {
  if (!isSubscriptionActiveRecord(input.subscription, input.now)) {
    return false
  }

  const orderId = input.orderId?.trim()
  const paymentHash = input.paymentHash?.trim()
  const matchesOrder = Boolean(orderId && input.subscription?.lastOrderId === orderId)
  const matchesPayment = Boolean(paymentHash && input.subscription?.lastPaymentIdHash === paymentHash)

  return matchesOrder || matchesPayment
}

export function shouldRevokeAccessForBillingEvent(input: {
  eventType: string
  orderAmountPaise?: number | null
  amountRefundedPaise?: number | null
  paymentStatus?: string | null
  refundStatus?: string | null
}) {
  const eventType = input.eventType.trim().toLowerCase()
  if (eventType.startsWith("payment.dispute")) {
    return true
  }

  const paymentStatus = (input.paymentStatus || "").trim().toLowerCase()
  const refundStatus = (input.refundStatus || "").trim().toLowerCase()

  if (paymentStatus === "refunded" || refundStatus === "full") {
    return true
  }

  return (
    typeof input.orderAmountPaise === "number" &&
    input.orderAmountPaise > 0 &&
    typeof input.amountRefundedPaise === "number" &&
    input.amountRefundedPaise >= input.orderAmountPaise
  )
}

export function resolveBillingTimestamp(input: {
  primaryMs?: number | null
  secondaryMs?: number | null
  now?: number
}) {
  if (typeof input.primaryMs === "number" && Number.isFinite(input.primaryMs) && input.primaryMs > 0) {
    return input.primaryMs
  }

  if (typeof input.secondaryMs === "number" && Number.isFinite(input.secondaryMs) && input.secondaryMs > 0) {
    return input.secondaryMs
  }

  return input.now ?? Date.now()
}
