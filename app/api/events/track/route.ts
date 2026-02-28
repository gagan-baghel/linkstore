import { NextResponse } from "next/server"
import { z } from "zod"

import { convexMutation, convexQuery } from "@/lib/convex"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

const trackEventSchema = z.object({
  eventType: z.enum(["store_view", "product_card_click", "outbound_click"]),
  productId: z.string().trim().regex(/^[a-zA-Z0-9_-]+$/).max(128).optional(),
  storeUsername: z.string().trim().min(1).max(64),
  source: z.string().trim().max(100).optional(),
  referrer: z.string().trim().max(500).optional(),
  device: z.string().trim().max(40).optional(),
  path: z.string().trim().max(240).optional(),
  sessionId: z.string().trim().max(120).optional(),
}).superRefine((value, ctx) => {
  const requiresProduct = value.eventType === "product_card_click" || value.eventType === "outbound_click"
  if (requiresProduct && !value.productId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["productId"],
      message: "productId is required for product events.",
    })
  }

  if (!requiresProduct && value.productId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["productId"],
      message: "productId is not allowed for store_view events.",
    })
  }
})

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:events:track:${ip}`, windowMs: 60 * 1000, max: 300 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const body = await req.json()
    const payload = trackEventSchema.parse(body)
    const owner = await convexQuery<{ username: string }, { _id: string; username: string } | null>(
      "users:getPublicByUsername",
      { username: payload.storeUsername },
    )

    if (!owner?._id) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 })
    }

    const userAgent = (req.headers.get("user-agent") || "").slice(0, 500)

    const result = await convexMutation<
      {
        eventType: "store_view" | "product_card_click" | "outbound_click"
        userId: string
        productId?: string
        storeUsername: string
        source?: string
        referrer?: string
        device?: string
        path?: string
        sessionId?: string
        userAgent?: string
        ip?: string
      },
      { ok: boolean; message?: string }
    >("events:trackEvent", {
      eventType: payload.eventType,
      userId: owner._id,
      productId: payload.productId,
      storeUsername: owner.username,
      source: payload.source || "direct",
      referrer: (payload.referrer || req.headers.get("referer") || "").slice(0, 500),
      device: payload.device || "unknown",
      path: payload.path || "",
      sessionId: payload.sessionId || "",
      userAgent,
      ip,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Failed to track event" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payload", errors: error.errors }, { status: 400 })
    }

    console.error("Track event error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
