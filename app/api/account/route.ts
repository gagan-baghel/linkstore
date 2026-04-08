import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { tryNormalizeAffiliateUrl } from "@/lib/affiliate-url"
import { convexMutation, convexQuery } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { getStoreCacheTag } from "@/lib/store-cache"
import { getUsernameValidationMessage, isValidUsername, normalizeUsernameInput } from "@/lib/username"

const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().min(3).max(30),
  image: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid image URL"),
  storeLogo: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid logo URL"),
})

export async function PUT(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:account:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, username, image, storeLogo } = accountSchema.parse(body)
    const existingUser = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(
      () => null,
    )
    const previousUsername = existingUser?.username?.trim().toLowerCase() || ""
    const normalizedUsername = normalizeUsernameInput(username)

    if (!isValidUsername(normalizedUsername)) {
      return NextResponse.json({ message: getUsernameValidationMessage(normalizedUsername) || "Invalid username." }, { status: 400 })
    }

    const result = await convexMutation<
      { userId: string; name: string; username: string; image?: string; storeLogo?: string },
      { ok: boolean; message?: string; user?: any; code?: string }
    >("users:updateAccount", {
      userId: session.user.id,
      name,
      username: normalizedUsername,
      image: image || "",
      storeLogo: storeLogo || "",
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Failed to update account" }, { status: 409 })
    }

    if (previousUsername) {
      revalidateTag(getStoreCacheTag(previousUsername))
    }
    const nextUsername = result.user?.username?.trim().toLowerCase() || normalizedUsername
    if (nextUsername && nextUsername !== previousUsername) {
      revalidateTag(getStoreCacheTag(nextUsername))
    }

    return NextResponse.json({
      message: "Account updated successfully",
      user: result.user
        ? {
            name: result.user.name || "",
            email: result.user.email || "",
            username: result.user.username || "",
          }
        : null,
    })
  } catch (error) {
    console.error("Account update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
