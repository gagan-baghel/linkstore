import { NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"
import { writeAuditLog } from "@/lib/audit"
import { fetchRazorpayPayment, isRazorpayConfigured, verifyRazorpayPaymentSignature } from "@/lib/razorpay"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { encryptSensitive, hashSensitive, hasPaymentsDataKeyConfigured } from "@/lib/secure-data"
import { resolveBillingTimestamp } from "@/lib/subscription-billing"
import { SUBSCRIPTION_CURRENCY, SUBSCRIPTION_PRICE_PAISE } from "@/lib/subscription"

const verifySchema = z.object({
  razorpay_payment_id: z.string().trim().min(6).max(128),
  razorpay_order_id: z.string().trim().min(6).max(128),
  razorpay_signature: z.string().trim().min(32).max(256),
})

export async function POST(req: Request) {
  const ip = getClientIp(req.headers)
  const userAgent = req.headers.get("user-agent") || ""

  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ message: "Billing is temporarily unavailable. Razorpay is not configured." }, { status: 503 })
    }

    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const rate = await checkRateLimitAsync({ key: `api:subscription:verify:${ip}`, windowMs: 60 * 1000, max: 40 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!hasPaymentsDataKeyConfigured()) {
      return NextResponse.json({ message: "Payment encryption key is not configured." }, { status: 503 })
    }

    const body = await req.json()
    const payload = verifySchema.parse(body)

    const signatureValid = verifyRazorpayPaymentSignature({
      orderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
      signature: payload.razorpay_signature,
    })

    if (!signatureValid) {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.verify_signature_failed",
        resourceType: "subscription_payment",
        status: "failed",
        ip,
        userAgent,
      })
      return NextResponse.json({ message: "Invalid payment signature." }, { status: 400 })
    }

    const payment = await fetchRazorpayPayment(payload.razorpay_payment_id)
    const paymentStatus = (payment.status || "").toLowerCase()

    if (payment.order_id !== payload.razorpay_order_id) {
      return NextResponse.json({ message: "Payment order mismatch." }, { status: 409 })
    }

    if (payment.amount !== SUBSCRIPTION_PRICE_PAISE || payment.currency !== SUBSCRIPTION_CURRENCY) {
      return NextResponse.json({ message: "Unexpected payment amount or currency." }, { status: 409 })
    }

    if (typeof payment.amount_refunded === "number" && payment.amount_refunded > 0) {
      return NextResponse.json({ message: "Refunded payment cannot activate subscription." }, { status: 409 })
    }

    if (paymentStatus !== "captured") {
      if (paymentStatus === "authorized") {
        return NextResponse.json({ message: "Payment is authorized but not captured yet." }, { status: 409 })
      }
      if (paymentStatus === "failed") {
        return NextResponse.json({ message: "Payment failed." }, { status: 409 })
      }
      return NextResponse.json({ message: "Payment is not confirmed yet." }, { status: 409 })
    }

    const paymentIdHash = hashSensitive(payload.razorpay_payment_id)
    const signatureHash = hashSensitive(payload.razorpay_signature)
    const encryptedPaymentId = encryptSensitive(payload.razorpay_payment_id)

    const capturedAtMs = resolveBillingTimestamp({
      primaryMs: Date.now(),
      secondaryMs: typeof payment.created_at === "number" ? payment.created_at * 1000 : undefined,
    })

    const result = await convexMutation<
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
      { ok: boolean; message?: string; access?: any; code?: string }
    >("subscriptions:confirmPayment", {
      userId: session.user.id,
      razorpayOrderId: payload.razorpay_order_id,
      paymentIdEncrypted: encryptedPaymentId,
      paymentIdHash,
      signatureHash,
      amountPaise: payment.amount,
      currency: payment.currency,
      capturedAt: capturedAtMs,
      source: "verify",
      eventKey: `verify:${paymentIdHash}`,
    })

    if (!result.ok) {
      await writeAuditLog({
        actorType: "user",
        actorUserId: session.user.id,
        action: "subscription.verify_finalize_failed",
        resourceType: "subscription_payment",
        status: "failed",
        ip,
        userAgent,
        details: JSON.stringify({ code: result.code || "UNKNOWN", message: result.message || "Unknown" }),
      })
      return NextResponse.json({ message: result.message || "Unable to activate subscription." }, { status: 409 })
    }

    await writeAuditLog({
      actorType: "user",
      actorUserId: session.user.id,
      action: "subscription.activated_via_verify",
      resourceType: "subscription",
      status: "ok",
      ip,
      userAgent,
      details: JSON.stringify({ expiresAt: result.access?.expiresAt || null }),
    })

    return NextResponse.json({
      ok: true,
      access: result.access,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payment verification payload", errors: error.errors }, { status: 400 })
    }

    console.error("Subscription verify error:", error)
    return NextResponse.json({ message: "Payment verification failed" }, { status: 500 })
  }
}
