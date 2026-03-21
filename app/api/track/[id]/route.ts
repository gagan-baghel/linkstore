import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { normalizeAffiliateUrl } from "@/lib/affiliate-url"
import { convexMutation } from "@/lib/convex"
import { getRequestInsights } from "@/lib/request-insights"
import { checkRateLimitAsync, getClientIp, tooManyRequests } from "@/lib/security"

const trackIdSchema = z.object({
  id: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
})

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

function getOptionalParam(searchParams: URLSearchParams, key: string, maxLength: number) {
  return (searchParams.get(key) || "").trim().slice(0, maxLength)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedParams = trackIdSchema.parse(await params)
    const { id } = parsedParams
    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:track:${ip}`, windowMs: 60 * 1000, max: 240 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const referrer = (req.headers.get("referer") || "").slice(0, 500)
    const userAgent = (req.headers.get("user-agent") || "").slice(0, 500)
    const source = getSource(req.nextUrl.searchParams, referrer).slice(0, 100)
    const medium = getOptionalParam(req.nextUrl.searchParams, "utm_medium", 100).toLowerCase()
    const campaign = getOptionalParam(req.nextUrl.searchParams, "utm_campaign", 120)
    const content = getOptionalParam(req.nextUrl.searchParams, "utm_content", 120)
    const term = getOptionalParam(req.nextUrl.searchParams, "utm_term", 120)
    const insights = getRequestInsights(req.headers, userAgent)
    const path = (req.nextUrl.searchParams.get("path") || "").slice(0, 240)
    const sessionId = (req.nextUrl.searchParams.get("sessionId") || "").slice(0, 120)
    const collectionSlug = getOptionalParam(req.nextUrl.searchParams, "collection", 120).toLowerCase()

    const result = await convexMutation<
      {
        productId: string
        ip: string
        userAgent: string
        referrer: string
        source?: string
        medium?: string
        campaign?: string
        content?: string
        term?: string
        device?: string
        browser?: string
        os?: string
        deviceName?: string
        country?: string
        region?: string
        city?: string
        path?: string
        sessionId?: string
        collectionSlug?: string
      },
      { ok: boolean; message?: string; affiliateUrl?: string }
    >("clicks:trackClick", {
      productId: id,
      ip,
      userAgent,
      referrer,
      source,
      medium,
      campaign,
      content,
      term,
      device: insights.device,
      browser: insights.browser,
      os: insights.os,
      deviceName: insights.deviceName,
      country: insights.country,
      region: insights.region,
      city: insights.city,
      path,
      sessionId,
      collectionSlug,
    })

    if (!result.ok || !result.affiliateUrl) {
      return NextResponse.json({ message: result.message || "Product not found" }, { status: 404 })
    }

    let safeRedirect = ""
    try {
      safeRedirect = normalizeAffiliateUrl(result.affiliateUrl)
    } catch {
      return NextResponse.json({ message: "Unsafe redirect URL blocked" }, { status: 400 })
    }

    return NextResponse.redirect(safeRedirect)
  } catch (error) {
    console.error("Click tracking error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid tracking request", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
