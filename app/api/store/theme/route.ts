import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { getStoreCacheTag } from "@/lib/store-cache"
import { requireActiveSubscription } from "@/lib/subscription-access"

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a valid 6-digit hex color.")

const storeThemeSchema = z.object({
  themePrimaryColor: hexColor,
  themeAccentColor: hexColor,
  themeBannerStyle: z.enum(["gradient", "solid", "soft"]),
  themeButtonStyle: z.enum(["rounded", "pill", "square"]),
  themeCardStyle: z.enum(["shadow", "outline", "flat"]),
  themeMode: z.enum(["system", "light", "dark"]),
})

export async function PUT(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:store-theme:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "update_store_theme")
    if (!access.ok) return access.response

    const body = await req.json()
    const { themePrimaryColor, themeAccentColor, themeBannerStyle, themeButtonStyle, themeCardStyle, themeMode } =
      storeThemeSchema.parse(body)
    const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(
      () => null,
    )
    const username = user?.username?.trim().toLowerCase() || ""

    const result = await convexMutation<
      {
        userId: string
        themePrimaryColor: string
        themeAccentColor: string
        themeBannerStyle: string
        themeButtonStyle: string
        themeCardStyle: string
        themeMode: string
      },
      { ok: boolean; message?: string; code?: string }
    >("users:updateStoreTheme", {
      userId: session.user.id,
      themePrimaryColor,
      themeAccentColor,
      themeBannerStyle,
      themeButtonStyle,
      themeCardStyle,
      themeMode,
    })

    if (!result.ok) {
      const status = result.code === "SUBSCRIPTION_REQUIRED" ? 402 : 400
      return NextResponse.json({ message: result.message || "Failed to update theme", code: result.code || "" }, { status })
    }

    if (username) {
      revalidateTag(getStoreCacheTag(username), "max")
    }

    return NextResponse.json({ message: "Store theme updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Store theme update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
