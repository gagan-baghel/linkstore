import { NextResponse } from "next/server"
import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"

export async function POST(req: Request) {
  try {
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { userId } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

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
