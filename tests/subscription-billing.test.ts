import test from "node:test"
import assert from "node:assert/strict"

import {
  canTransitionSubscriptionStatus,
  isCurrentSubscriptionEntitlement,
  isSubscriptionActiveRecord,
  resolveBillingTimestamp,
  resolveStoreEnabled,
  shouldRevokeAccessForBillingEvent,
} from "@/lib/subscription-billing"

test("isSubscriptionActiveRecord requires active status and future expiry", () => {
  assert.equal(isSubscriptionActiveRecord({ status: "active", expiresAt: 2_000 }, 1_000), true)
  assert.equal(isSubscriptionActiveRecord({ status: "active", expiresAt: 500 }, 1_000), false)
  assert.equal(isSubscriptionActiveRecord({ status: "cancelled", expiresAt: 2_000 }, 1_000), false)
})

test("resolveStoreEnabled only exposes storefront when billing access is active", () => {
  assert.equal(resolveStoreEnabled({ userStoreEnabled: true, hasActiveSubscription: true }), true)
  assert.equal(resolveStoreEnabled({ userStoreEnabled: true, hasActiveSubscription: false }), false)
  assert.equal(resolveStoreEnabled({ userStoreEnabled: false, hasActiveSubscription: true }), false)
})

test("isCurrentSubscriptionEntitlement matches only the current paid order or payment", () => {
  const subscription = {
    status: "active",
    expiresAt: 5_000,
    lastOrderId: "order_latest",
    lastPaymentIdHash: "payment_hash_latest",
  }

  assert.equal(
    isCurrentSubscriptionEntitlement({ subscription, orderId: "order_latest", now: 1_000 }),
    true,
  )
  assert.equal(
    isCurrentSubscriptionEntitlement({ subscription, paymentHash: "payment_hash_latest", now: 1_000 }),
    true,
  )
  assert.equal(
    isCurrentSubscriptionEntitlement({ subscription, orderId: "order_old", paymentHash: "payment_hash_old", now: 1_000 }),
    false,
  )
})

test("shouldRevokeAccessForBillingEvent ignores partial refunds but revokes on full refunds and disputes", () => {
  assert.equal(
    shouldRevokeAccessForBillingEvent({
      eventType: "refund.processed",
      orderAmountPaise: 14_900,
      amountRefundedPaise: 5_000,
      refundStatus: "partial",
    }),
    false,
  )

  assert.equal(
    shouldRevokeAccessForBillingEvent({
      eventType: "payment.refunded",
      orderAmountPaise: 14_900,
      amountRefundedPaise: 14_900,
      paymentStatus: "refunded",
    }),
    true,
  )

  assert.equal(
    shouldRevokeAccessForBillingEvent({
      eventType: "payment.dispute.created",
      orderAmountPaise: 14_900,
    }),
    true,
  )
})

test("resolveBillingTimestamp prefers the primary timestamp and falls back deterministically", () => {
  assert.equal(resolveBillingTimestamp({ primaryMs: 3_000, secondaryMs: 2_000, now: 1_000 }), 3_000)
  assert.equal(resolveBillingTimestamp({ secondaryMs: 2_000, now: 1_000 }), 2_000)
  assert.equal(resolveBillingTimestamp({ now: 1_000 }), 1_000)
})

test("canTransitionSubscriptionStatus only allows safe lifecycle transitions", () => {
  assert.equal(canTransitionSubscriptionStatus("inactive", "active"), true)
  assert.equal(canTransitionSubscriptionStatus("pending", "active"), true)
  assert.equal(canTransitionSubscriptionStatus("active", "pending"), false)
  assert.equal(canTransitionSubscriptionStatus("cancelled", "pending"), false)
})
