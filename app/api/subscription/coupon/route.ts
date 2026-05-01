import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { convexMutation } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { normalizeSubscriptionCouponCode, validateSubscriptionCoupon } from "@/lib/subscription-coupon"
import { getStoreCacheTag } from "@/lib/store-cache"

const STORE_REVALIDATION_PROFILE = "max" as const

const couponSchema = z.object({
  couponCode: z.string().trim().min(1).max(64),
})

export async function POST(req: Request) {
  const ip = getClientIp(req.headers)
  const userAgent = req.headers.get("user-agent") || ""

  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ipRate = await checkRateLimitAsync({ key: `api:subscription:coupon:${ip}`, windowMs: 60 * 1000, max: 20 })
    if (!ipRate.allowed) {
      return tooManyRequests(ipRate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const accountRate = await checkRateLimitAsync({
      key: `api:subscription:coupon:user:${session.user.id}`,
      windowMs: 10 * 60 * 1000,
      max: 6,
    })
    if (!accountRate.allowed) {
      return tooManyRequests(accountRate.retryAfterSec)
    }

    const body = await req.json()
    const payload = couponSchema.parse(body)
    const normalizedCoupon = normalizeSubscriptionCouponCode(payload.couponCode)
    const validation = validateSubscriptionCoupon(normalizedCoupon)

    if (!validation.ok) {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.coupon_rejected",
        resourceType: "subscription",
        status: "failed",
        ip,
        userAgent,
        details: JSON.stringify({ reason: validation.reason }),
      })

      if (validation.reason === "expired") {
        return NextResponse.json({ message: "This coupon has expired." }, { status: 410 })
      }

      if (validation.reason === "not_configured" || validation.reason === "misconfigured") {
        return NextResponse.json({ message: "Coupon redemption is temporarily unavailable." }, { status: 503 })
      }

      return NextResponse.json({ message: "Invalid coupon code." }, { status: 400 })
    }

    const result = await convexMutation<
      {
        userId: string
        couponHash: string
        maxRedemptions: number
        expiresAt: number
        onlyForInactive: boolean
      },
      { ok: boolean; message?: string; access?: any }
    >("subscriptions:grantCouponSubscription", {
      userId: session.user.id,
      couponHash: validation.couponHash,
      maxRedemptions: validation.maxRedemptions,
      expiresAt: validation.expiresAt,
      onlyForInactive: validation.onlyForInactive,
    })

    if (!result.ok) {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.coupon_grant_failed",
        resourceType: "subscription",
        status: "failed",
        ip,
        userAgent,
        details: JSON.stringify({ message: result.message || "Unknown" }),
      })
      return NextResponse.json({ message: result.message || "Unable to apply coupon." }, { status: 409 })
    }

    await writeAuditLog({
      actorType: "user",
      actorUserId: session.user.id,
      action: "subscription.coupon_applied",
      resourceType: "subscription",
      status: "ok",
      ip,
      userAgent,
      details: JSON.stringify({ expiresAt: result.access?.expiresAt || null }),
    })

    if (session.user.username) {
      revalidateTag(getStoreCacheTag(session.user.username), STORE_REVALIDATION_PROFILE)
    }

    return NextResponse.json({
      ok: true,
      access: result.access,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid coupon payload", errors: error.errors }, { status: 400 })
    }

    console.error("Subscription coupon error:", error)
    return NextResponse.json({ message: "Failed to apply coupon" }, { status: 500 })
  }
}
