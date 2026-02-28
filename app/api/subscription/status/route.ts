import { NextResponse } from "next/server"

import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/security"
import { SUBSCRIPTION_PLAN_CODE, SUBSCRIPTION_PLAN_NAME, SUBSCRIPTION_PRICE_PAISE, SUBSCRIPTION_CURRENCY, SUBSCRIPTION_PRODUCT_LIMIT } from "@/lib/subscription"

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:subscription:status:${ip}`, windowMs: 60 * 1000, max: 120 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const [state, plan] = await Promise.all([
      convexQuery<{ userId: string }, any>("subscriptions:getAccessState", { userId: session.user.id }),
      convexQuery<{}, any>("subscriptions:getPlan", {}),
    ])

    return NextResponse.json({
      plan: {
        code: plan?.code || SUBSCRIPTION_PLAN_CODE,
        name: SUBSCRIPTION_PLAN_NAME,
        amountPaise: plan?.amountPaise || SUBSCRIPTION_PRICE_PAISE,
        currency: plan?.currency || SUBSCRIPTION_CURRENCY,
        productLimit: plan?.productLimit || SUBSCRIPTION_PRODUCT_LIMIT,
      },
      access: state,
    })
  } catch (error) {
    console.error("Subscription status error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
