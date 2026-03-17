import crypto from "crypto"

import { NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { createRazorpayOrder, getPublicRazorpayKeyId, isRazorpayConfigured } from "@/lib/razorpay"
import { SUBSCRIPTION_PLAN_CODE, SUBSCRIPTION_PLAN_NAME, SUBSCRIPTION_PRICE_PAISE, SUBSCRIPTION_CURRENCY } from "@/lib/subscription"
import { writeAuditLog } from "@/lib/audit"

const checkoutSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
})

export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ message: "Billing is temporarily unavailable. Razorpay is not configured." }, { status: 503 })
    }

    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:subscription:checkout:${ip}`, windowMs: 60 * 1000, max: 25 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let parsed: { idempotencyKey?: string } = {}
    try {
      const body = await req.json()
      parsed = checkoutSchema.parse(body)
    } catch {
      parsed = {}
    }

    const now = Date.now()
    const idempotencyKey =
      parsed.idempotencyKey ||
      `sub_${session.user.id.slice(-8)}_${Math.floor(now / (2 * 60 * 1000))}_${crypto.randomBytes(3).toString("hex")}`

    const reusableOrder = await convexQuery<{ userId: string }, any | null>("subscriptions:getReusablePendingOrder", {
      userId: session.user.id,
    })

    if (reusableOrder?.razorpayOrderId) {
      return NextResponse.json({
        checkout: {
          keyId: getPublicRazorpayKeyId(),
          orderId: reusableOrder.razorpayOrderId,
          amountPaise: reusableOrder.amountPaise,
          currency: reusableOrder.currency,
          planCode: SUBSCRIPTION_PLAN_CODE,
          planName: SUBSCRIPTION_PLAN_NAME,
          reused: true,
        },
      })
    }

    const existingByIdempotency = await convexQuery<
      { userId: string; idempotencyKey: string },
      {
        conflict: boolean
        razorpayOrderId: string
        amountPaise: number
        currency: string
        status: string
        expiresAt: number
      } | null
    >("subscriptions:getOrderByIdempotencyKey", {
      userId: session.user.id,
      idempotencyKey,
    })

    if (existingByIdempotency?.conflict) {
      return NextResponse.json({ message: "Idempotency key conflict." }, { status: 409 })
    }

    if (existingByIdempotency?.status === "paid") {
      return NextResponse.json({ message: "This payment request has already been completed." }, { status: 409 })
    }

    if (
      existingByIdempotency?.status === "pending" &&
      typeof existingByIdempotency.expiresAt === "number" &&
      existingByIdempotency.expiresAt > now &&
      existingByIdempotency.amountPaise === SUBSCRIPTION_PRICE_PAISE &&
      existingByIdempotency.currency === SUBSCRIPTION_CURRENCY
    ) {
      return NextResponse.json({
        checkout: {
          keyId: getPublicRazorpayKeyId(),
          orderId: existingByIdempotency.razorpayOrderId,
          amountPaise: existingByIdempotency.amountPaise,
          currency: existingByIdempotency.currency,
          planCode: SUBSCRIPTION_PLAN_CODE,
          planName: SUBSCRIPTION_PLAN_NAME,
          reused: true,
        },
      })
    }

    const receipt = `sub_${session.user.id.slice(-10)}_${now}`.slice(0, 40)
    const order = await createRazorpayOrder({
      receipt,
      notes: {
        planCode: SUBSCRIPTION_PLAN_CODE,
        userId: session.user.id,
      },
    })

    const record = await convexMutation<
      {
        userId: string
        razorpayOrderId: string
        amountPaise: number
        currency: string
        receipt: string
        idempotencyKey: string
        pendingTtlMs?: number
      },
      {
        ok: boolean
        message?: string
        code?: string
        reused?: boolean
        order?: {
          razorpayOrderId: string
          status: string
          amountPaise: number
          currency: string
        }
      }
    >("subscriptions:createCheckoutOrderRecord", {
      userId: session.user.id,
      razorpayOrderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      idempotencyKey,
      pendingTtlMs: 15 * 60 * 1000,
    })

    if (!record.ok) {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.checkout_order_create_failed",
        resourceType: "subscription_order",
        status: "failed",
        ip,
        userAgent: req.headers.get("user-agent") || "",
        details: JSON.stringify({ code: record.code || "UNKNOWN", message: record.message || "Unknown" }),
      })
      return NextResponse.json({ message: record.message || "Unable to create checkout order" }, { status: 409 })
    }

    if (record.reused && record.order?.razorpayOrderId) {
      if (record.order.status === "paid") {
        return NextResponse.json({ message: "This payment request has already been completed." }, { status: 409 })
      }

      if (record.order.status !== "pending") {
        return NextResponse.json(
          { message: "Unable to reuse the previous checkout order. Please retry checkout." },
          { status: 409 },
        )
      }

      return NextResponse.json({
        checkout: {
          keyId: getPublicRazorpayKeyId(),
          orderId: record.order.razorpayOrderId,
          amountPaise: record.order.amountPaise,
          currency: record.order.currency,
          planCode: SUBSCRIPTION_PLAN_CODE,
          planName: SUBSCRIPTION_PLAN_NAME,
          reused: true,
        },
      })
    }

    await writeAuditLog({
      actorType: "user",
      actorUserId: session.user.id,
      action: "subscription.checkout_order_created",
      resourceType: "subscription_order",
      resourceId: order.id,
      status: "ok",
      ip,
      userAgent: req.headers.get("user-agent") || "",
      details: JSON.stringify({ amountPaise: order.amount, currency: order.currency }),
    })

    return NextResponse.json({
      checkout: {
        keyId: getPublicRazorpayKeyId(),
        orderId: order.id,
        amountPaise: order.amount,
        currency: order.currency,
        planCode: SUBSCRIPTION_PLAN_CODE,
        planName: SUBSCRIPTION_PLAN_NAME,
      },
    })
  } catch (error) {
    console.error("Subscription checkout error:", error)
    return NextResponse.json({ message: "Failed to initialize checkout" }, { status: 500 })
  }
}
