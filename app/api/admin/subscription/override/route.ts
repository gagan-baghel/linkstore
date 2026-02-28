import { NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"
import { writeAuditLog } from "@/lib/audit"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

const overrideSchema = z.object({
  targetUserId: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  action: z.enum(["cancel", "reactivate", "extend30", "expire"]),
  reason: z.string().trim().max(300).optional(),
})

export async function PUT(req: Request) {
  const ip = getClientIp(req.headers)
  const userAgent = req.headers.get("user-agent") || ""

  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const rate = checkRateLimit({ key: `api:admin:subscription:override:${ip}`, windowMs: 60 * 1000, max: 30 })
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
        action: "subscription.admin_override_forbidden",
        resourceType: "subscription",
        status: "failed",
        ip,
        userAgent,
      })
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const payload = overrideSchema.parse(body)

    const result = await convexMutation<
      {
        adminUserId: string
        targetUserId: string
        action: "cancel" | "reactivate" | "extend30" | "expire"
        reason?: string
      },
      { ok: boolean; message?: string; access?: any }
    >("subscriptions:adminOverride", {
      adminUserId: session.user.id,
      targetUserId: payload.targetUserId,
      action: payload.action,
      reason: payload.reason,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Override failed" }, { status: 400 })
    }

    await writeAuditLog({
      actorType: "admin",
      actorUserId: session.user.id,
      action: `subscription.admin_override.${payload.action}`,
      resourceType: "subscription",
      resourceId: payload.targetUserId,
      status: "ok",
      ip,
      userAgent,
      details: JSON.stringify({ reason: payload.reason || "" }),
    })

    return NextResponse.json({ ok: true, access: result.access })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payload", errors: error.errors }, { status: 400 })
    }

    console.error("Admin subscription override error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
