import { NextResponse } from "next/server"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

export async function PUT(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:onboarding-complete:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const result = await convexMutation<{ userId: string }, { ok: boolean; message?: string }>("users:completeOnboarding", {
      userId: session.user.id,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Failed to complete onboarding" }, { status: 400 })
    }

    return NextResponse.json({ message: "Onboarding completed" }, { status: 200 })
  } catch (error) {
    console.error("Onboarding completion error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
