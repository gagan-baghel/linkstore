import type { Metadata } from "next"

import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import DashboardClientPage from "./DashboardClientPage"

export const metadata: Metadata = {
  title: "Dashboard - AffiliateHub",
  description: "Manage your affiliate products and store",
}

export default async function DashboardPage() {
  const session = await getSafeServerSession()

  if (!session) {
    return <div>Loading...</div>
  }

  let initialData: {
    user: any
    totalProducts: number
    recentProducts: any[]
    quickMetrics?: {
      storeViews30: number
      cardClicks30: number
      outboundClicks30: number
      conversionRate30: number
    }
    linkHealth?: any
  } | null = null

  try {
    const data = await convexQuery<{ userId: string }, any>("analytics:getDashboardData", { userId: session.user.id })
    if (data?.ok) {
      initialData = {
        user: data.user,
        totalProducts: data.totalProducts,
        recentProducts: data.recentProducts,
        quickMetrics: data.quickMetrics,
        linkHealth: data.linkHealth,
      }
    }
  } catch (error) {
    console.error("Dashboard preload error:", error)
  }

  return <DashboardClientPage session={session} initialData={initialData} />
}
