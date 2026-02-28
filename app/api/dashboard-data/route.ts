import { NextResponse } from "next/server"
import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:dashboard-data:${ip}`, windowMs: 60 * 1000, max: 120 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const data = await convexQuery<{ userId: string }, any>("analytics:getDashboardData", { userId })

    if (!data?.ok) {
      return NextResponse.json({ message: data?.message || "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: data.user,
      totalProducts: data.totalProducts,
      recentProducts: data.recentProducts,
      quickMetrics: data.quickMetrics,
      linkHealth: data.linkHealth,
    })
  } catch (error) {
    console.error("Dashboard data error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
