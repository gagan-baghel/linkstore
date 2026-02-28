import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"
import { getStoreCacheTag } from "@/lib/store-cache"

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a valid 6-digit hex color.")

const storeThemeSchema = z.object({
  themePrimaryColor: hexColor,
  themeAccentColor: hexColor,
  themeBannerStyle: z.enum(["gradient", "solid", "soft"]),
  themeButtonStyle: z.enum(["rounded", "pill", "square"]),
  themeCardStyle: z.enum(["shadow", "outline", "flat"]),
})

export async function PUT(req: Request) {
  try {
    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { themePrimaryColor, themeAccentColor, themeBannerStyle, themeButtonStyle, themeCardStyle } =
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
      },
      { ok: boolean; message?: string }
    >("users:updateStoreTheme", {
      userId: session.user.id,
      themePrimaryColor,
      themeAccentColor,
      themeBannerStyle,
      themeButtonStyle,
      themeCardStyle,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Failed to update theme" }, { status: 400 })
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
