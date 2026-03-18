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
