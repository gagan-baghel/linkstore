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
    const primaryUserId = session.user.id
    const sessionEmail = typeof session.user.email === "string" ? session.user.email.trim().toLowerCase() : ""

    let data = await convexQuery<{ userId: string }, any>("analytics:getDashboardData", { userId: primaryUserId })

    // Recover gracefully if a previous local mapping points to an old user id.
    if (!data?.ok && sessionEmail) {
      const userByEmail = await convexQuery<{ email: string }, any | null>("users:getByEmail", {
        email: sessionEmail,
      })

      if (userByEmail?._id && userByEmail._id !== primaryUserId) {
        data = await convexQuery<{ userId: string }, any>("analytics:getDashboardData", {
          userId: userByEmail._id,
        })
      }
    }

    if (!data?.ok) {
      return NextResponse.json({
        user: null,
        totalProducts: 0,
        recentProducts: [],
        quickMetrics: {
          storeViews30: 0,
          cardClicks30: 0,
          outboundClicks30: 0,
          conversionRate30: 0,
        },
        linkHealth: {
          brokenCount: 0,
          staleCount: 0,
          brokenProducts: [],
        },
        message: data?.message || "User not found",
      })
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
