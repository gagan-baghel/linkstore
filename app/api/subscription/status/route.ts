import { NextResponse } from "next/server"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"
import { fetchRazorpayPaymentsForOrder, isRazorpayConfigured } from "@/lib/razorpay"
import { checkRateLimitAsync, getClientIp, tooManyRequests } from "@/lib/security"
import { encryptSensitive, hashSensitive, hasPaymentsDataKeyConfigured } from "@/lib/secure-data"
import { resolveBillingTimestamp } from "@/lib/subscription-billing"
import { SUBSCRIPTION_PLAN_CODE, SUBSCRIPTION_PLAN_NAME, SUBSCRIPTION_PRICE_PAISE, SUBSCRIPTION_CURRENCY, SUBSCRIPTION_PRODUCT_LIMIT } from "@/lib/subscription"

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:subscription:status:${ip}`, windowMs: 60 * 1000, max: 120 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let [state, plan] = await Promise.all([
      convexQuery<{ userId: string }, any>("subscriptions:getAccessState", { userId: session.user.id }),
      convexQuery<{}, any>("subscriptions:getPlan", {}),
    ])

    if (
      state?.effectiveStatus !== "active" &&
      isRazorpayConfigured() &&
      hasPaymentsDataKeyConfigured()
    ) {
      const pendingOrder = await convexQuery<{ userId: string; maxAgeMs?: number }, any | null>(
        "subscriptions:getLatestPendingOrderForUser",
        { userId: session.user.id, maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
      ).catch(() => null)

      if (pendingOrder?.razorpayOrderId) {
        const payments = await fetchRazorpayPaymentsForOrder(pendingOrder.razorpayOrderId).catch(() => null)
        const capturedPayment = (payments?.items || [])
          .filter(
            (payment: any) =>
              payment?.status === "captured" &&
              payment?.order_id === pendingOrder.razorpayOrderId &&
              payment?.amount === pendingOrder.amountPaise &&
              payment?.currency === pendingOrder.currency &&
              (payment?.amount_refunded || 0) === 0,
          )
          .sort((left: any, right: any) => (right?.created_at || 0) - (left?.created_at || 0))[0]

        if (capturedPayment?.id) {
          const paymentIdHash = hashSensitive(capturedPayment.id)
          await convexMutation<
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
            { ok: boolean }
          >("subscriptions:confirmPayment", {
            userId: session.user.id,
            razorpayOrderId: pendingOrder.razorpayOrderId,
            paymentIdEncrypted: encryptSensitive(capturedPayment.id),
            paymentIdHash,
            signatureHash: "",
            amountPaise: capturedPayment.amount,
            currency: capturedPayment.currency,
            capturedAt: resolveBillingTimestamp({
              primaryMs: Date.now(),
              secondaryMs: typeof capturedPayment.created_at === "number" ? capturedPayment.created_at * 1000 : undefined,
            }),
            source: "verify",
            eventKey: `status-reconcile:${paymentIdHash}`,
          }).catch(() => null)

          state = await convexQuery<{ userId: string }, any>("subscriptions:getAccessState", {
            userId: session.user.id,
          }).catch(() => state)
        }
      }
    }

    return NextResponse.json(
      {
        plan: {
          code: plan?.code || SUBSCRIPTION_PLAN_CODE,
          name: SUBSCRIPTION_PLAN_NAME,
          amountPaise: plan?.amountPaise || SUBSCRIPTION_PRICE_PAISE,
          currency: plan?.currency || SUBSCRIPTION_CURRENCY,
          productLimit: plan?.productLimit || SUBSCRIPTION_PRODUCT_LIMIT,
        },
        access: state,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch (error) {
    console.error("Subscription status error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
