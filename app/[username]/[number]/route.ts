import { NextRequest, NextResponse } from "next/server"

import { convexQuery } from "@/lib/convex"
import { parseProductNumberQuery } from "@/lib/product-number"
import { checkRateLimitAsync, getClientIp, tooManyRequests } from "@/lib/security"

// Short link for captions: /{username}/{productNumber} → tracked affiliate redirect.
// Unknown numbers fall back to the store's shop search instead of a dead end.
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string; number: string }> }) {
  const { username, number } = await params
  const productNumber = parseProductNumberQuery(number)
  const storeUrl = new URL(`/${encodeURIComponent(username)}`, req.url)
  if (productNumber === null) {
    return NextResponse.redirect(storeUrl)
  }

  const rate = await checkRateLimitAsync({ key: `api:shortlink:${getClientIp(req.headers)}`, windowMs: 60 * 1000, max: 240 })
  if (!rate.allowed) {
    return tooManyRequests(rate.retryAfterSec)
  }

  const match = await convexQuery<{ username: string; productNumber: number }, { productId: string } | null>(
    "stores:getProductByNumber",
    { username, productNumber },
  ).catch(() => null)

  if (!match) {
    storeUrl.searchParams.set("q", `#${productNumber}`)
    return NextResponse.redirect(storeUrl)
  }

  const trackUrl = new URL(`/api/track/${match.productId}`, req.url)
  req.nextUrl.searchParams.forEach((value, key) => trackUrl.searchParams.set(key, value))
  if (!trackUrl.searchParams.has("source") && !trackUrl.searchParams.has("utm_source")) {
    const referrer = req.headers.get("referer")
    if (!referrer) trackUrl.searchParams.set("source", "shortlink")
  }
  trackUrl.searchParams.set("path", `/${username}/${productNumber}`)
  return NextResponse.redirect(trackUrl)
}
