import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"
import { getStoreCacheTag } from "@/lib/store-cache"

const storeSchema = z.object({
  storeBannerText: z.string().min(2),
  storeBio: z.string().max(500).optional().or(z.literal("")),
  contactInfo: z.string().optional(),
  storeLogo: z.string().optional(),
  socialFacebook: z.string().url().optional().or(z.literal("")),
  socialTwitter: z.string().url().optional().or(z.literal("")),
  socialInstagram: z.string().url().optional().or(z.literal("")),
  socialYoutube: z.string().url().optional().or(z.literal("")),
  socialWebsite: z.string().url().optional().or(z.literal("")),
})

export async function PUT(req: Request) {
  try {
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      storeBannerText,
      storeBio,
      contactInfo,
      storeLogo,
      socialFacebook,
      socialTwitter,
      socialInstagram,
      socialYoutube,
      socialWebsite,
    } = storeSchema.parse(body)
    const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(
      () => null,
    )
    const username = user?.username?.trim().toLowerCase() || ""

    const result = await convexMutation<
      {
        userId: string
        storeBannerText: string
        storeBio: string
        contactInfo?: string
        storeLogo?: string
        socialFacebook?: string
        socialTwitter?: string
        socialInstagram?: string
        socialYoutube?: string
        socialWebsite?: string
      },
      { ok: boolean; message?: string }
    >("users:updateStore", {
      userId: session.user.id,
      storeBannerText,
      storeBio: storeBio || "",
      contactInfo: contactInfo || "",
      storeLogo: storeLogo || "",
      socialFacebook: socialFacebook || "",
      socialTwitter: socialTwitter || "",
      socialInstagram: socialInstagram || "",
      socialYoutube: socialYoutube || "",
      socialWebsite: socialWebsite || "",
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Failed to update store" }, { status: 400 })
    }

    if (username) {
      revalidateTag(getStoreCacheTag(username), "max")
    }

    return NextResponse.json({ message: "Store settings updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Store settings update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
