import { NextResponse } from "next/server"

import { convexQuery } from "@/lib/convex"
import { SUBSCRIPTION_PRODUCT_LIMIT, type SubscriptionAccessState } from "@/lib/subscription"

export async function getSubscriptionAccessState(userId: string): Promise<SubscriptionAccessState | null> {
  try {
    const state = await convexQuery<{ userId: string }, SubscriptionAccessState | null>("subscriptions:getAccessState", {
      userId,
    })
    return state
  } catch (error) {
    console.error("Subscription access state lookup failed:", error)
    return null
  }
}

export async function requireActiveSubscription(userId: string, contextAction: string) {
  const state = await getSubscriptionAccessState(userId)
  if (!state) {
    return {
      ok: false as const,
      state: null,
      response: NextResponse.json(
        { message: "Subscription state is unavailable right now. Access denied by default." },
        { status: 403 },
      ),
    }
  }

  if (!state.canUsePremiumActions || !state.hasActiveSubscription) {
    const message =
      state.effectiveStatus === "pending"
        ? "Payment is still pending confirmation. Please wait or retry verification."
        : state.effectiveStatus === "active"
          ? "Subscription access is currently restricted."
          : "An active subscription is required for this action."

    return {
      ok: false as const,
      state,
      response: NextResponse.json(
        {
          message,
          code: "SUBSCRIPTION_REQUIRED",
          action: contextAction,
          status: state.effectiveStatus,
          productLimit: SUBSCRIPTION_PRODUCT_LIMIT,
          currentProductCount: state.currentProductCount,
          remainingProductSlots: state.remainingProductSlots,
          expiresAt: state.expiresAt,
        },
        { status: 402 },
      ),
    }
  }

  return { ok: true as const, state, response: null }
}
