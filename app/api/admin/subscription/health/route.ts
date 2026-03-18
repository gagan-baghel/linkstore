import { NextResponse } from "next/server"

import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { checkRateLimitAsync, getClientIp, tooManyRequests } from "@/lib/security"

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:admin:subscription:health:${ip}`, windowMs: 60 * 1000, max: 60 })
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

    const result = await convexQuery<{ adminUserId: string }, any>("subscriptions:getBillingHealthSummary", {
      adminUserId: session.user.id,
    })

    if (!result?.ok) {
      return NextResponse.json({ message: result?.message || "Unable to load billing health." }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin billing health error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
