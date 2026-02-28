import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { requireActiveSubscription } from "@/lib/subscription-access"

const routeParamsSchema = z.object({
  id: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:products:duplicate:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const { id } = routeParamsSchema.parse(await params)
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "duplicate_product")
    if (!access.ok) return access.response

    const result = await convexMutation<
      { productId: string; userId: string },
      { ok: boolean; message?: string; code?: string; product?: any }
    >("products:duplicateByIdForUser", {
      productId: id,
      userId: session.user.id,
    })

    if (!result.ok) {
      const status =
        result.code === "SUBSCRIPTION_REQUIRED"
          ? 402
          : result.code === "PRODUCT_LIMIT_REACHED"
            ? 409
            : 404
      return NextResponse.json({ message: result.message || "Product not found", code: result.code || "" }, { status })
    }

    return NextResponse.json({ message: "Product duplicated", product: result.product }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid product id", errors: error.errors }, { status: 400 })
    }
    console.error("Duplicate product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
