import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { normalizeAffiliateUrl } from "@/lib/affiliate-url"
import { convexMutation, convexQuery } from "@/lib/convex"
import { fetchProductMetadata } from "@/lib/product-metadata"
import { getStoreCacheTag } from "@/lib/store-cache"

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  affiliateUrl: z.string().trim().min(1),
  category: z.string().min(2).max(60).optional().default("General"),
  images: z.array(z.string()).optional().default([]),
  videoUrl: z.string().url().optional().or(z.literal("")),
})

async function revalidateStoreForUser(userId: string) {
  const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId }).catch(() => null)
  const username = user?.username?.trim().toLowerCase()
  if (!username) return
  revalidateTag(getStoreCacheTag(username), "max")
}

export async function POST(req: Request) {
  try {
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

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
    if (finalImages.length === 0) {
      finalImages = ["/placeholder.jpg"]
    }

    const result = await convexMutation<
      {
        userId: string
        title: string
        description: string
        affiliateUrl: string
        category?: string
        images: string[]
        videoUrl?: string
      },
      { ok: boolean; message?: string; product?: any }
    >("products:createProduct", {
      userId: session.user.id,
      title,
      description,
      affiliateUrl,
      category,
      images: finalImages,
      videoUrl: videoUrl || "",
    })

    if (!result.ok || !result.product) {
      return NextResponse.json({ message: result.message || "Failed to create product" }, { status: 400 })
    }

    await revalidateStoreForUser(session.user.id)

    // Convert to plain object
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

    return NextResponse.json(
      {
        product: serializedProduct,
        message: "Product created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Product creation error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const products = await convexQuery<{ userId: string; limit?: number }, any[]>("products:listByUser", {
      userId: session.user.id,
    })

    // Convert MongoDB documents to plain objects
    const serializedProducts = products.map((product) => ({
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
    }))

    return NextResponse.json({ products: serializedProducts })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
