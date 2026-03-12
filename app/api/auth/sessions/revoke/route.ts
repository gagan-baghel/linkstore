import { NextResponse } from "next/server"

import { applySessionCookie, getSafeServerSession } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:auth:sessions:revoke:${ip}`, windowMs: 10 * 60 * 1000, max: 10 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const result = await convexMutation<
      { userId: string },
      { ok: boolean; message?: string; authVersion?: number }
    >("users:rotateAuthVersion", {
      userId: session.user.id,
    })

    if (!result.ok || !result.authVersion) {
      return NextResponse.json({ message: result.message || "Unable to revoke sessions." }, { status: 409 })
    }

    const response = NextResponse.json({ message: "Other sessions were signed out." })
    await applySessionCookie(response, { userId: session.user.id, authVersion: result.authVersion })
    return response
  } catch (error) {
    console.error("Session revoke error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
