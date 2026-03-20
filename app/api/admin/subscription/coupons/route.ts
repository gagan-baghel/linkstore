import { NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { convexMutation, convexQuery } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import {
  SUBSCRIPTION_COUPON_DURATION_MS,
  isValidSubscriptionCouponCode,
  maskSubscriptionCouponCode,
  normalizeSubscriptionCouponCode,
} from "@/lib/subscription-coupons"
import { hashSubscriptionCouponCode, isCouponHashingAvailable } from "@/lib/subscription-coupon-hash"

const createCouponSchema = z.object({
  code: z.string().trim().min(4).max(64),
  label: z.string().trim().min(2).max(80),
  maxRedemptions: z.number().int().min(1).max(1_000_000).optional(),
  expiresAt: z.number().int().positive().optional(),
  note: z.string().trim().max(400).optional(),
})

const updateCouponStatusSchema = z.object({
  couponId: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  isActive: z.boolean(),
  reason: z.string().trim().max(300).optional(),
})

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 })
}

export async function GET(req: Request) {
  const ip = getClientIp(req.headers)

  try {
    const rate = await checkRateLimitAsync({ key: `api:admin:subscription:coupons:get:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return forbidden()
    }

    const result = await convexQuery<{ adminUserId: string }, { ok: boolean; message?: string; coupons: any[] }>("subscriptions:listCoupons", {
      adminUserId: session.user.id,
    })

    if (!result.ok) {
      return forbidden()
    }

    return NextResponse.json({ ok: true, coupons: result.coupons || [] })
  } catch (error) {
    console.error("Admin coupon list error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers)
  const userAgent = req.headers.get("user-agent") || ""

  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const rate = await checkRateLimitAsync({ key: `api:admin:subscription:coupons:create:${ip}`, windowMs: 60 * 1000, max: 30 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.coupon_create_forbidden",
        resourceType: "subscription_coupon",
        status: "failed",
        ip,
        userAgent,
      })
      return forbidden()
    }

    const body = await req.json()
    const payload = createCouponSchema.parse(body)
    const normalizedCode = normalizeSubscriptionCouponCode(payload.code)
    const codeHint = maskSubscriptionCouponCode(normalizedCode)

    if (!isValidSubscriptionCouponCode(normalizedCode)) {
      return NextResponse.json({ message: "Coupon code format is invalid." }, { status: 400 })
    }

    if (!isCouponHashingAvailable()) {
      return NextResponse.json({ message: "Coupon creation is temporarily unavailable." }, { status: 503 })
    }

    const result = await convexMutation<
      {
        adminUserId: string
        codeHash: string
        codeHint: string
        label: string
        durationMs: number
        maxRedemptions?: number
        expiresAt?: number
        note?: string
      },
      { ok: boolean; message?: string; code?: string; coupon?: any }
    >("subscriptions:createCoupon", {
      adminUserId: session.user.id,
      codeHash: hashSubscriptionCouponCode(normalizedCode),
      codeHint,
      label: payload.label,
      durationMs: SUBSCRIPTION_COUPON_DURATION_MS,
      maxRedemptions: payload.maxRedemptions,
      expiresAt: payload.expiresAt,
      note: payload.note,
    })

    if (!result.ok) {
      await writeAuditLog({
        actorType: "admin",
        actorUserId: session.user.id,
        action: "subscription.coupon_create_failed",
        resourceType: "subscription_coupon",
        status: "failed",
        ip,
        userAgent,
        details: JSON.stringify({ codeHint, code: result.code || "UNKNOWN", message: result.message || "" }),
      })
      return NextResponse.json({ message: result.message || "Coupon could not be created.", code: result.code || "" }, { status: 409 })
    }

    await writeAuditLog({
      actorType: "admin",
      actorUserId: session.user.id,
      action: "subscription.coupon_created",
      resourceType: "subscription_coupon",
      resourceId: result.coupon?.id,
      status: "ok",
      ip,
      userAgent,
      details: JSON.stringify({ codeHint }),
    })

    return NextResponse.json({ ok: true, coupon: result.coupon || null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payload", errors: error.errors }, { status: 400 })
    }

    console.error("Admin coupon create error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const ip = getClientIp(req.headers)
  const userAgent = req.headers.get("user-agent") || ""

  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const rate = await checkRateLimitAsync({ key: `api:admin:subscription:coupons:update:${ip}`, windowMs: 60 * 1000, max: 40 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return forbidden()
    }

    const body = await req.json()
    const payload = updateCouponStatusSchema.parse(body)

    const result = await convexMutation<
      {
        adminUserId: string
        couponId: string
        isActive: boolean
        reason?: string
      },
      { ok: boolean; message?: string; code?: string; coupon?: any }
    >("subscriptions:updateCouponStatus", {
      adminUserId: session.user.id,
      couponId: payload.couponId,
      isActive: payload.isActive,
      reason: payload.reason,
    })

    if (!result.ok) {
      await writeAuditLog({
        actorType: "admin",
        actorUserId: session.user.id,
        action: "subscription.coupon_status_update_failed",
        resourceType: "subscription_coupon",
        resourceId: payload.couponId,
        status: "failed",
        ip,
        userAgent,
        details: JSON.stringify({ code: result.code || "UNKNOWN", message: result.message || "" }),
      })
      const status = result.code === "COUPON_NOT_FOUND" ? 404 : 400
      return NextResponse.json({ message: result.message || "Coupon could not be updated.", code: result.code || "" }, { status })
    }

    await writeAuditLog({
      actorType: "admin",
      actorUserId: session.user.id,
      action: payload.isActive ? "subscription.coupon_activated" : "subscription.coupon_deactivated",
      resourceType: "subscription_coupon",
      resourceId: payload.couponId,
      status: "ok",
      ip,
      userAgent,
      details: JSON.stringify({ reason: payload.reason || "" }),
    })

    return NextResponse.json({ ok: true, coupon: result.coupon || null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payload", errors: error.errors }, { status: 400 })
    }

    console.error("Admin coupon update error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
