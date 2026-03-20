import { NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { convexMutation } from "@/lib/convex"
import { getConfiguredSubscriptionCoupon } from "@/lib/runtime-config"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import {
  SUBSCRIPTION_COUPON_DURATION_MS,
  isValidSubscriptionCouponCode,
  maskSubscriptionCouponCode,
  normalizeSubscriptionCouponCode,
} from "@/lib/subscription-coupons"
import { hashSubscriptionCouponCode } from "@/lib/subscription-coupon-hash"

const redeemCouponSchema = z.object({
  couponCode: z.string().trim().min(4).max(64),
})

export async function POST(req: Request) {
  const ip = getClientIp(req.headers)
  const userAgent = req.headers.get("user-agent") || ""

  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const rate = await checkRateLimitAsync({ key: `api:subscription:coupon:${ip}`, windowMs: 60 * 1000, max: 20 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const payload = redeemCouponSchema.parse(body)
    const normalizedCode = normalizeSubscriptionCouponCode(payload.couponCode)
    const codeHint = maskSubscriptionCouponCode(normalizedCode)
    const codeHash = hashSubscriptionCouponCode(normalizedCode)
    const configuredCoupon = getConfiguredSubscriptionCoupon()

    if (!isValidSubscriptionCouponCode(normalizedCode)) {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.coupon_redeem_invalid_format",
        resourceType: "subscription_coupon",
        status: "failed",
        ip,
        userAgent,
        details: JSON.stringify({ codeHint }),
      })
      return NextResponse.json({ message: "Coupon code format is invalid." }, { status: 400 })
    }

    const result = await convexMutation<
      any,
      {
        ok: boolean
        message?: string
        code?: string
        expiresAt?: number
        access?: any
        coupon?: {
          id: string
          codeHint: string
          label: string
          durationMs: number
          redemptionCount: number
          maxRedemptions: number | null
        }
      }
    >(
      configuredCoupon.configured && configuredCoupon.code === normalizedCode
        ? "subscriptions:redeemConfiguredCoupon"
        : "subscriptions:redeemCoupon",
      configuredCoupon.configured && configuredCoupon.code === normalizedCode
        ? {
            userId: session.user.id,
            codeHash,
            codeHint,
            couponLabel: configuredCoupon.label,
            durationMs: configuredCoupon.durationMs,
            maxRedemptions: configuredCoupon.maxRedemptions,
            expiresAt: configuredCoupon.expiresAt,
          }
        : {
            userId: session.user.id,
            codeHash,
            codeHint,
          },
    )

    if (!result.ok) {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.coupon_redeem_failed",
        resourceType: "subscription_coupon",
        status: "failed",
        ip,
        userAgent,
        details: JSON.stringify({ codeHint, code: result.code || "UNKNOWN", message: result.message || "" }),
      })

      const status =
        result.code === "USER_NOT_FOUND"
          ? 404
          : result.code === "AMBIGUOUS_SUBSCRIPTION"
            ? 409
            : result.code === "COUPON_INVALID"
              ? 404
              : result.code === "COUPON_ALREADY_REDEEMED"
                ? 409
                : 400

      return NextResponse.json({ message: result.message || "Coupon could not be applied.", code: result.code || "" }, { status })
    }

    await writeAuditLog({
      actorType: "user",
      actorUserId: session.user.id,
      action: "subscription.coupon_redeemed",
      resourceType: "subscription_coupon",
      resourceId: result.coupon?.id,
      status: "ok",
      ip,
      userAgent,
      details: JSON.stringify({
        codeHint,
        expiresAt: result.expiresAt || null,
        durationMs: result.coupon?.durationMs || SUBSCRIPTION_COUPON_DURATION_MS,
      }),
    })

    return NextResponse.json({
      ok: true,
      message: "Coupon applied successfully.",
      expiresAt: result.expiresAt || null,
      coupon: result.coupon || null,
      access: result.access || null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payload", errors: error.errors }, { status: 400 })
    }

    console.error("Coupon redemption error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
