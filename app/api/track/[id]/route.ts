import { NextRequest, NextResponse } from "next/server"
import { convexMutation } from "@/lib/convex"

function getDeviceFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet"
  if (ua.includes("mobi") || ua.includes("android")) return "mobile"
  return "desktop"
}

function getSource(searchParams: URLSearchParams, referrer: string) {
  const explicit = searchParams.get("source") || searchParams.get("utm_source")
  if (explicit) return explicit.toLowerCase()
  if (!referrer) return "direct"
  try {
    return new URL(referrer).hostname.toLowerCase()
  } catch {
    return "direct"
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const referrer = req.headers.get("referer") || ""
    const userAgent = req.headers.get("user-agent") || ""
    const ip = req.headers.get("x-forwarded-for") || "anonymous"
    const source = getSource(req.nextUrl.searchParams, referrer)
    const device = getDeviceFromUserAgent(userAgent)
    const path = req.nextUrl.searchParams.get("path") || ""
    const sessionId = req.nextUrl.searchParams.get("sessionId") || ""

    const result = await convexMutation<
      {
        productId: string
        ip: string
        userAgent: string
        referrer: string
        source?: string
        device?: string
        path?: string
        sessionId?: string
      },
      { ok: boolean; message?: string; affiliateUrl?: string }
    >("clicks:trackClick", {
      productId: id,
      ip,
      userAgent,
      referrer,
      source,
      device,
      path,
      sessionId,
    })

    if (!result.ok || !result.affiliateUrl) {
      return NextResponse.json({ message: result.message || "Product not found" }, { status: 404 })
    }

    return NextResponse.redirect(result.affiliateUrl)
  } catch (error) {
    console.error("Click tracking error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
