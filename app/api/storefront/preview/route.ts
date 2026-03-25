import { NextResponse } from "next/server"

import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { getCachedStoreData } from "@/lib/store-cache"

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:storefront-preview:${ip}`, windowMs: 60 * 1000, max: 120 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(
      () => null,
    )
    if (!user?.username) {
      return NextResponse.json({ message: "Username not found" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const requestedUsername = typeof body?.username === "string" ? body.username.trim().toLowerCase() : ""
    if (requestedUsername && requestedUsername !== user.username.trim().toLowerCase()) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const storeData = await getCachedStoreData(user.username)
    if (!storeData) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 })
    }

    return NextResponse.json({ store: storeData })
  } catch (error) {
    console.error("Storefront preview error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
