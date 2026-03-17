import { NextResponse } from "next/server"
import { z } from "zod"

import { convexMutation } from "@/lib/convex"
import { isRazorpayWebhookConfigured, verifyRazorpayWebhookSignature } from "@/lib/razorpay"
import { checkRateLimitAsync, getClientIp, tooManyRequests } from "@/lib/security"
import { encryptSensitive, hashSensitive, hasPaymentsDataKeyConfigured } from "@/lib/secure-data"
import { writeAuditLog } from "@/lib/audit"

const webhookEnvelopeSchema = z.object({
  event: z.string().min(1),
  payload: z.record(z.any()).optional(),
})

function extractPaymentEntity(payload: any): any | null {
  if (payload?.payment?.entity) return payload.payment.entity
  if (payload?.payment) return payload.payment
  if (payload?.refund?.entity?.payment_id) {
    return {
      id: payload.refund.entity.payment_id,
      order_id: payload.refund.entity.order_id,
      amount: payload.refund.entity.amount,
      currency: payload.refund.entity.currency,
      status: "refunded",
      created_at: payload.refund.entity.created_at,
    }
  }
  return null
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers)

  try {
    if (!isRazorpayWebhookConfigured()) {
      return NextResponse.json({ message: "Webhook endpoint is not configured." }, { status: 503 })
    }

    const rate = await checkRateLimitAsync({ key: `api:subscription:webhook:${ip}`, windowMs: 60 * 1000, max: 240 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    if (!hasPaymentsDataKeyConfigured()) {
      return NextResponse.json({ message: "Payment encryption key is not configured." }, { status: 503 })
    }

    const rawBody = await req.text()
    const signature = req.headers.get("x-razorpay-signature") || ""
    const headerEventId = (req.headers.get("x-razorpay-event-id") || "").trim()

    if (!signature) {
      return NextResponse.json({ message: "Missing webhook signature" }, { status: 401 })
    }

    const isValidSignature = verifyRazorpayWebhookSignature(rawBody, signature)
    if (!isValidSignature) {
      await writeAuditLog({
        actorType: "webhook",
        action: "subscription.webhook_signature_failed",
        resourceType: "webhook",
        status: "failed",
        ip,
        userAgent: req.headers.get("user-agent") || "",
      })
      return NextResponse.json({ message: "Invalid webhook signature" }, { status: 401 })
    }

    const parsed = webhookEnvelopeSchema.parse(JSON.parse(rawBody))
    const payment = extractPaymentEntity(parsed.payload || {})
    const paymentId = typeof payment?.id === "string" ? payment.id : ""
    const orderId = typeof payment?.order_id === "string" ? payment.order_id : ""

    const paymentHash = paymentId ? hashSensitive(paymentId) : ""
    const encryptedPaymentId = paymentId ? encryptSensitive(paymentId) : ""
    const signatureHash = hashSensitive(signature)
    const payloadHash = hashSensitive(rawBody)

    const eventKey = headerEventId || `webhook:${parsed.event}:${payloadHash.slice(0, 24)}`

    const result = await convexMutation<
      {
        eventKey: string
        eventType: string
        payloadHash: string
        razorpayOrderId?: string
        paymentIdEncrypted?: string
        paymentIdHash?: string
        signatureHash?: string
        amountPaise?: number
        currency?: string
        paymentStatus?: string
        capturedAt?: number
        failureCode?: string
        failureReason?: string
      },
      { ok: boolean; message?: string }
    >("subscriptions:processWebhookEvent", {
      eventKey,
      eventType: parsed.event,
      payloadHash,
      razorpayOrderId: orderId || undefined,
      paymentIdEncrypted: encryptedPaymentId || undefined,
      paymentIdHash: paymentHash || undefined,
      signatureHash,
      amountPaise: typeof payment?.amount === "number" ? payment.amount : undefined,
      currency: typeof payment?.currency === "string" ? payment.currency : undefined,
      paymentStatus: typeof payment?.status === "string" ? payment.status : undefined,
      capturedAt: typeof payment?.created_at === "number" ? payment.created_at * 1000 : undefined,
      failureCode: typeof payment?.error_code === "string" ? payment.error_code : undefined,
      failureReason: typeof payment?.error_description === "string" ? payment.error_description : undefined,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Webhook processing failed" }, { status: 500 })
    }

    await writeAuditLog({
      actorType: "webhook",
      action: "subscription.webhook_processed",
      resourceType: "webhook",
      resourceId: eventKey,
      status: "ok",
      ip,
      userAgent: req.headers.get("user-agent") || "",
      details: JSON.stringify({ event: parsed.event, orderId: orderId || null }),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid webhook payload", errors: error.errors }, { status: 400 })
    }

    console.error("Subscription webhook error:", error)
    return NextResponse.json({ message: "Webhook processing error" }, { status: 500 })
  }
}
