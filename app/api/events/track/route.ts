import { NextResponse } from "next/server"
import { z } from "zod"

import { convexMutation } from "@/lib/convex"

const trackEventSchema = z.object({
  eventType: z.enum(["store_view", "product_card_click", "outbound_click"]),
  userId: z.string().min(1),
  productId: z.string().optional(),
  storeUsername: z.string().min(1),
  source: z.string().optional(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  path: z.string().optional(),
  sessionId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = trackEventSchema.parse(body)

    const userAgent = req.headers.get("user-agent") || ""
    const ip = req.headers.get("x-forwarded-for") || "anonymous"

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
      userId: payload.userId,
      productId: payload.productId,
      storeUsername: payload.storeUsername,
      source: payload.source || "direct",
      referrer: payload.referrer || req.headers.get("referer") || "",
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
