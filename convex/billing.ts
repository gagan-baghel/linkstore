"use node"

import { actionGeneric, makeFunctionReference } from "convex/server"
import { v } from "convex/values"

import { encryptSensitive, hashSensitive } from "../lib/secure-data"

type ReconciliationOrder = {
  _id: string
  userId: string
  razorpayOrderId: string
  amountPaise: number
  currency: string
  status: string
  createdAt: number
  updatedAt: number
  expiresAt: number
  paidAt?: number
  refundedAt?: number
  razorpayPaymentIdHash: string
  providerPaymentStatus?: string
}

type RazorpayPayment = {
  id: string
  order_id: string
  amount: number
  currency: string
  status: string
  created_at?: number
  amount_refunded?: number
  refund_status?: string | null
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || ""
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || ""
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.")
  }
  return { keyId, keySecret }
}

async function fetchRazorpayPaymentsForOrder(orderId: string) {
  const { keyId, keySecret } = getRazorpayCredentials()
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}/payments`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })

  const text = await response.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (!response.ok) {
    const message = json?.error?.description || json?.error?.reason || `Razorpay request failed (${response.status})`
    throw new Error(message)
  }

  return Array.isArray(json?.items) ? (json.items as RazorpayPayment[]) : []
}

function billingTimestampFromPayment(payment: RazorpayPayment) {
  if (typeof payment.created_at === "number" && Number.isFinite(payment.created_at) && payment.created_at > 0) {
    return payment.created_at * 1000
  }
  return Date.now()
}

export const runBillingReconciliation = actionGeneric({
  args: {
    limit: v.optional(v.number()),
    lookbackMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const getOrdersRef = makeFunctionReference<
      "query",
      { lookbackMs?: number; limit?: number },
      ReconciliationOrder[]
    >("subscriptions:getOrdersForReconciliation")
    const confirmPaymentRef = makeFunctionReference<
      "mutation",
      {
        userId: string
        razorpayOrderId: string
        paymentIdEncrypted: string
        paymentIdHash: string
        signatureHash: string
        amountPaise: number
        currency: string
        capturedAt: number
        source: "verify" | "webhook"
        eventKey: string
      },
      { ok: boolean; message?: string }
    >("subscriptions:confirmPayment")
    const expirePendingOrderRef = makeFunctionReference<
      "mutation",
      { orderId: string },
      { ok: boolean; skipped?: boolean }
    >("subscriptions:expirePendingOrder")
    const recordBillingAlertRef = makeFunctionReference<
      "mutation",
      {
        dedupeKey: string
        category: string
        severity: "critical" | "high" | "medium" | "low"
        userId?: string
        orderId?: string
        paymentHash?: string
        message: string
        details?: string
      },
      { ok: boolean }
    >("subscriptions:recordBillingAlert")
    const resolveBillingAlertRef = makeFunctionReference<"mutation", { dedupeKey: string }, { ok: boolean }>(
      "subscriptions:resolveBillingAlert",
    )
    const recordRunRef = makeFunctionReference<
      "mutation",
      {
        scope: string
        status: "ok" | "warning" | "failed"
        checkedCount: number
        reconciledCount: number
        flaggedCount: number
        details?: string
      },
      { ok: boolean }
    >("subscriptions:recordBillingReconciliationRun")

    const now = Date.now()
    const orders = await ctx.runQuery(getOrdersRef, {
      limit: args.limit ?? 200,
      lookbackMs: args.lookbackMs ?? 7 * 24 * 60 * 60 * 1000,
    })

    let checkedCount = 0
    let reconciledCount = 0
    let flaggedCount = 0
    const notes: string[] = []

    for (const order of orders) {
      checkedCount += 1
      const baseAlertKey = `${order.userId}:${order.razorpayOrderId}`

      if (order.status === "pending" && order.expiresAt <= now) {
        await ctx.runMutation(expirePendingOrderRef, { orderId: order._id })
      }

      let payments: RazorpayPayment[] = []
      try {
        payments = await fetchRazorpayPaymentsForOrder(order.razorpayOrderId)
        await ctx.runMutation(resolveBillingAlertRef, { dedupeKey: `gateway-unreachable:${baseAlertKey}` })
      } catch (error) {
        flaggedCount += 1
        notes.push(`gateway:${order.razorpayOrderId}`)
        await ctx.runMutation(recordBillingAlertRef, {
          dedupeKey: `gateway-unreachable:${baseAlertKey}`,
          category: "gateway_reconciliation",
          severity: "critical",
          userId: order.userId,
          orderId: order.razorpayOrderId,
          paymentHash: order.razorpayPaymentIdHash || undefined,
          message: "Could not reconcile order against Razorpay.",
          details: error instanceof Error ? error.message : String(error),
        })
        continue
      }

      const capturedPayments = payments
        .filter(
          (payment) =>
            payment.order_id === order.razorpayOrderId &&
            payment.amount === order.amountPaise &&
            payment.currency === order.currency &&
            payment.status === "captured" &&
            (payment.amount_refunded || 0) === 0,
        )
        .sort((left, right) => (right.created_at || 0) - (left.created_at || 0))

      const refundedPayments = payments.filter((payment) => (payment.amount_refunded || 0) > 0 || payment.status === "refunded")
      const capturedPayment = capturedPayments[0]

      if (order.status === "pending" && capturedPayment) {
        const paymentIdHash = hashSensitive(capturedPayment.id)
        const result = await ctx.runMutation(confirmPaymentRef, {
          userId: order.userId,
          razorpayOrderId: order.razorpayOrderId,
          paymentIdEncrypted: encryptSensitive(capturedPayment.id),
          paymentIdHash,
          signatureHash: hashSensitive(`reconcile:${capturedPayment.id}`),
          amountPaise: capturedPayment.amount,
          currency: capturedPayment.currency,
          capturedAt: billingTimestampFromPayment(capturedPayment),
          source: "verify",
          eventKey: `reconcile:${paymentIdHash}`,
        })

        if (result.ok) {
          reconciledCount += 1
          await ctx.runMutation(resolveBillingAlertRef, { dedupeKey: `captured-no-entitlement:${baseAlertKey}` })
        } else {
          flaggedCount += 1
          await ctx.runMutation(recordBillingAlertRef, {
            dedupeKey: `captured-no-entitlement:${baseAlertKey}`,
            category: "payment_entitlement_gap",
            severity: "critical",
            userId: order.userId,
            orderId: order.razorpayOrderId,
            paymentHash: paymentIdHash,
            message: "Captured payment exists in Razorpay but entitlement could not be activated locally.",
            details: result.message || "",
          })
        }
      }

      if (order.status === "paid" && !capturedPayment && refundedPayments.length === 0) {
        flaggedCount += 1
        await ctx.runMutation(recordBillingAlertRef, {
          dedupeKey: `paid-no-provider-capture:${baseAlertKey}`,
          category: "provider_state_mismatch",
          severity: "critical",
          userId: order.userId,
          orderId: order.razorpayOrderId,
          paymentHash: order.razorpayPaymentIdHash || undefined,
          message: "Order is marked paid locally but Razorpay does not show a matching captured payment.",
          details: JSON.stringify({ providerPaymentStatus: order.providerPaymentStatus || "" }),
        })
      } else {
        await ctx.runMutation(resolveBillingAlertRef, { dedupeKey: `paid-no-provider-capture:${baseAlertKey}` })
      }

      if (refundedPayments.length > 0 && order.status !== "refunded" && order.status !== "chargeback") {
        flaggedCount += 1
        await ctx.runMutation(recordBillingAlertRef, {
          dedupeKey: `refund-mismatch:${baseAlertKey}`,
          category: "refund_state_mismatch",
          severity: "high",
          userId: order.userId,
          orderId: order.razorpayOrderId,
          paymentHash: order.razorpayPaymentIdHash || undefined,
          message: "Razorpay shows a refund-related payment state that is not yet reflected locally.",
          details: JSON.stringify(
            refundedPayments.map((payment) => ({
              id: payment.id,
              status: payment.status,
              amountRefunded: payment.amount_refunded || 0,
              refundStatus: payment.refund_status || "",
            })),
          ),
        })
      } else {
        await ctx.runMutation(resolveBillingAlertRef, { dedupeKey: `refund-mismatch:${baseAlertKey}` })
      }
    }

    const finalStatus = flaggedCount > 0 ? "warning" : "ok"
    await ctx.runMutation(recordRunRef, {
      scope: "scheduled",
      status: finalStatus,
      checkedCount,
      reconciledCount,
      flaggedCount,
      details: notes.join(","),
    })

    return {
      ok: true,
      status: finalStatus,
      checkedCount,
      reconciledCount,
      flaggedCount,
    }
  },
})
