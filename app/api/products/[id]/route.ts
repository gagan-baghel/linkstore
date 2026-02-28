import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { normalizeAffiliateUrl, tryNormalizeAffiliateUrl } from "@/lib/affiliate-url"
import { convexMutation, convexQuery } from "@/lib/convex"
import { fetchProductMetadata } from "@/lib/product-metadata"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { getStoreCacheTag } from "@/lib/store-cache"
import { requireActiveSubscription } from "@/lib/subscription-access"

const imageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value.startsWith("/") || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid image URL")

const productSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(4000),
  affiliateUrl: z.string().trim().min(1),
  category: z.string().trim().min(2).max(60).optional().default("General"),
  images: z.array(imageUrlSchema).max(10).optional().default([]),
  videoUrl: z.string().trim().url().max(1000).optional().or(z.literal("")),
})

const quickUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  affiliateUrl: z.string().trim().min(1).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  isArchived: z.boolean().optional(),
})

const routeParamsSchema = z.object({
  id: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
})

async function revalidateStoreForUser(userId: string) {
  const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId }).catch(() => null)
  const username = user?.username?.trim().toLowerCase()
  if (!username) return
  revalidateTag(getStoreCacheTag(username), "max")
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:products:get:${ip}`, windowMs: 60 * 1000, max: 240 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const { id } = routeParamsSchema.parse(await params)
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const product = await convexQuery<{ productId: string; userId: string }, any | null>("products:getByIdForUser", {
      productId: id,
      userId: session.user.id,
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    const serializedProduct = {
      _id: product._id,
      title: product.title,
      description: product.description,
      affiliateUrl: product.affiliateUrl,
      category: product.category || "General",
      images: product.images,
      videoUrl: product.videoUrl,
      userId: product.userId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      isArchived: product.isArchived === true,
      isLinkHealthy: product.isLinkHealthy !== false,
      lastLinkCheckAt: product.lastLinkCheckAt,
      lastLinkStatus: product.lastLinkStatus,
      lastLinkError: product.lastLinkError || "",
    }

    return NextResponse.json({ product: serializedProduct })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid product id", errors: error.errors }, { status: 400 })
    }
    console.error("Error fetching product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:products:update:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const { id } = routeParamsSchema.parse(await params)
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "update_product")
    if (!access.ok) return access.response

    const body = await req.json()
    const { title, description, affiliateUrl: rawAffiliateUrl, category, images, videoUrl } = productSchema.parse(body)
    const affiliateUrl = normalizeAffiliateUrl(rawAffiliateUrl)

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
      .slice(0, 10)
    if (finalImages.length === 0) {
      finalImages = ["/placeholder.jpg"]
    }

    const result = await convexMutation<
      {
        productId: string
        userId: string
        title: string
        description: string
        affiliateUrl: string
        category?: string
        images: string[]
        videoUrl?: string
      },
      { ok: boolean; message?: string; code?: string; product?: any }
    >("products:updateByIdForUser", {
      productId: id,
      userId: session.user.id,
      title,
      description,
      affiliateUrl,
      category,
      images: finalImages,
      videoUrl: videoUrl || "",
    })

    if (!result.ok || !result.product) {
      const status = result.code === "SUBSCRIPTION_REQUIRED" ? 402 : 404
      return NextResponse.json({ message: result.message || "Product not found", code: result.code || "" }, { status })
    }

    await revalidateStoreForUser(session.user.id)

    const serializedProduct = {
      _id: result.product._id,
      title: result.product.title,
      description: result.product.description,
      affiliateUrl: result.product.affiliateUrl,
      category: result.product.category || "General",
      images: result.product.images,
      videoUrl: result.product.videoUrl,
      userId: result.product.userId,
      createdAt: result.product.createdAt,
      updatedAt: result.product.updatedAt,
      isArchived: result.product.isArchived === true,
      isLinkHealthy: result.product.isLinkHealthy !== false,
      lastLinkCheckAt: result.product.lastLinkCheckAt,
      lastLinkStatus: result.product.lastLinkStatus,
      lastLinkError: result.product.lastLinkError || "",
    }

    return NextResponse.json({
      product: serializedProduct,
      message: "Product updated successfully",
    })
  } catch (error) {
    console.error("Product update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:products:delete:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const { id } = routeParamsSchema.parse(await params)
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "delete_product")
    if (!access.ok) return access.response

    const result = await convexMutation<{ productId: string; userId: string }, { ok: boolean; message?: string; code?: string }>(
      "products:deleteByIdForUser",
      {
        productId: id,
        userId: session.user.id,
      },
    )

    if (!result.ok) {
      const status = result.code === "SUBSCRIPTION_REQUIRED" ? 402 : 404
      return NextResponse.json({ message: result.message || "Product not found", code: result.code || "" }, { status })
    }

    await revalidateStoreForUser(session.user.id)

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    console.error("Product deletion error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:products:patch:${ip}`, windowMs: 60 * 1000, max: 80 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const { id } = routeParamsSchema.parse(await params)
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "patch_product")
    if (!access.ok) return access.response

    const body = await req.json()
    const payload = quickUpdateSchema.parse(body)
    const normalizedAffiliateUrl = payload.affiliateUrl ? normalizeAffiliateUrl(payload.affiliateUrl) : undefined

    const result = await convexMutation<
      {
        productId: string
        userId: string
        title?: string
        affiliateUrl?: string
        category?: string
        isArchived?: boolean
      },
      { ok: boolean; message?: string; code?: string; product?: any }
    >("products:quickUpdateByIdForUser", {
      productId: id,
      userId: session.user.id,
      title: payload.title,
      affiliateUrl: normalizedAffiliateUrl,
      category: payload.category,
      isArchived: payload.isArchived,
    })

    if (!result.ok || !result.product) {
      const status = result.code === "SUBSCRIPTION_REQUIRED" ? 402 : 404
      return NextResponse.json({ message: result.message || "Product not found", code: result.code || "" }, { status })
    }

    await revalidateStoreForUser(session.user.id)

    return NextResponse.json({
      message: "Product updated",
      product: {
        _id: result.product._id,
        title: result.product.title,
        description: result.product.description,
        affiliateUrl: result.product.affiliateUrl,
        category: result.product.category || "General",
        images: result.product.images,
        videoUrl: result.product.videoUrl,
        userId: result.product.userId,
        createdAt: result.product.createdAt,
        updatedAt: result.product.updatedAt,
        isArchived: result.product.isArchived === true,
        isLinkHealthy: result.product.isLinkHealthy !== false,
        lastLinkCheckAt: result.product.lastLinkCheckAt,
        lastLinkStatus: result.product.lastLinkStatus,
        lastLinkError: result.product.lastLinkError || "",
      },
    })
  } catch (error) {
    console.error("Product patch error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
