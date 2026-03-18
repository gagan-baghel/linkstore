import { NextResponse } from "next/server"

import { getSafeServerSession } from "@/lib/auth"
import { convexAction } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:admin:subscription:reconcile:${ip}`, windowMs: 60 * 1000, max: 10 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const result = await convexAction<{ limit?: number; lookbackMs?: number }, any>("billing:runBillingReconciliation", {
      limit: 250,
      lookbackMs: 7 * 24 * 60 * 60 * 1000,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin billing reconcile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
