import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { normalizeAffiliateUrl, tryNormalizeAffiliateUrl } from "@/lib/affiliate-url"
import { assertSafePublicHttpUrlForServerFetch } from "@/lib/affiliate-url-server"
import { convexMutation, convexQuery } from "@/lib/convex"
import { fetchProductMetadata } from "@/lib/product-metadata"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { getStoreCacheTag } from "@/lib/store-cache"
import { requireActiveSubscription } from "@/lib/subscription-access"

const imageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value.startsWith("/") || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid image URL")

const productSchema = z.object({
  title: z.string().trim().min(2).max(160),
  affiliateUrl: z.string().trim().min(1),
  category: z.string().trim().min(2).max(60).optional().default("General"),
  images: z.array(imageUrlSchema).max(1).optional().default([]),
})

function serializeProduct(product: any) {
  return {
    _id: product._id,
    title: product.title,
    affiliateUrl: product.affiliateUrl,
    category: product.category || "General",
    images: product.images,
    userId: product.userId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    isArchived: product.isArchived === true,
    isLinkHealthy: product.isLinkHealthy !== false,
    lastLinkCheckAt: product.lastLinkCheckAt,
    lastLinkStatus: product.lastLinkStatus,
    lastLinkError: product.lastLinkError || "",
  }
}

function isAffiliateUrlValidationError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false
  return (
    error.message.includes("affiliate URL") ||
    error.message.includes("Only http/https URLs are supported") ||
    error.message.includes("embedded credentials") ||
    error.message.includes("host is not allowed") ||
    error.message.includes("Unable to resolve URL host")
  )
}

async function revalidateStoreForUser(userId: string) {
  const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId }).catch(() => null)
  const username = user?.username?.trim().toLowerCase()
  if (!username) return
  revalidateTag(getStoreCacheTag(username), "max")
}

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:products:create:${ip}`, windowMs: 60 * 1000, max: 40 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "create_product")
    if (!access.ok) return access.response

    const body = await req.json()
    const { title, affiliateUrl: rawAffiliateUrl, category, images } = productSchema.parse(body)
    const affiliateUrl = normalizeAffiliateUrl(rawAffiliateUrl)
    await assertSafePublicHttpUrlForServerFetch(affiliateUrl)

    let finalImages = images.filter(Boolean)
    if (finalImages.length === 0) {
      const meta = await fetchProductMetadata(affiliateUrl).catch(() => null)
      if (meta?.image) {
        finalImages = [meta.image]
      }
    }
    finalImages = finalImages
      .map((img) => img.trim())
      .filter((img) => img.startsWith("/") || Boolean(tryNormalizeAffiliateUrl(img)))
      .slice(0, 1)
    if (finalImages.length === 0) {
      finalImages = ["/placeholder.jpg"]
    }

    const result = await convexMutation<
      {
        userId: string
        title: string
        affiliateUrl: string
        category?: string
        images: string[]
      },
      { ok: boolean; message?: string; code?: string; product?: any }
    >("products:createProduct", {
      userId: session.user.id,
      title,
      affiliateUrl,
      category,
      images: finalImages,
    })

    if (!result.ok || !result.product) {
      const status =
        result.code === "SUBSCRIPTION_REQUIRED"
          ? 402
          : result.code === "PRODUCT_LIMIT_REACHED"
            ? 409
            : 400
      return NextResponse.json({ message: result.message || "Failed to create product", code: result.code || "" }, { status })
    }

    await revalidateStoreForUser(session.user.id)

    return NextResponse.json(
      {
        product: serializeProduct(result.product),
        message: "Product created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Product creation error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    if (isAffiliateUrlValidationError(error)) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:products:list:${ip}`, windowMs: 60 * 1000, max: 240 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const products = await convexQuery<{ userId: string; limit?: number }, any[]>("products:listByUser", {
      userId: session.user.id,
    })

    // Convert MongoDB documents to plain objects
    const serializedProducts = products.map(serializeProduct)

    return NextResponse.json({ products: serializedProducts })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
