import { NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { normalizeAffiliateUrl } from "@/lib/affiliate-url"
import { assertSafePublicHttpUrlForServerFetch } from "@/lib/affiliate-url-server"
import { fetchProductMetadata } from "@/lib/product-metadata"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { requireActiveSubscription } from "@/lib/subscription-access"

const metadataSchema = z.object({
  affiliateUrl: z.string().trim().min(1, "Please enter an affiliate URL."),
})

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:products:metadata:${ip}`, windowMs: 60 * 1000, max: 30 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "fetch_product_metadata")
    if (!access.ok) return access.response

    const body = await req.json()
    const { affiliateUrl: rawAffiliateUrl } = metadataSchema.parse(body)
    const affiliateUrl = normalizeAffiliateUrl(rawAffiliateUrl)
    await assertSafePublicHttpUrlForServerFetch(affiliateUrl)

    const metadata = await fetchProductMetadata(affiliateUrl)

    return NextResponse.json({
      metadata: {
        title: metadata.title || "",
        description: metadata.description || "",
        images: metadata.image ? [metadata.image] : [],
      },
    })
  } catch (error) {
    console.error("Product metadata fetch error:", error)
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Invalid affiliate URL"
      return NextResponse.json({ message, errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Failed to fetch metadata from affiliate URL" }, { status: 400 })
  }
}
