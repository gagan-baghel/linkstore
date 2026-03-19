import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { tryNormalizeAffiliateUrl } from "@/lib/affiliate-url"
import { convexMutation, convexQuery } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { getStoreCacheTag } from "@/lib/store-cache"
import { requireActiveSubscription } from "@/lib/subscription-access"
import { isValidWhatsAppNumber } from "@/lib/whatsapp"

const socialLinksSchema = z.object({
  socialFacebook: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid Facebook URL"),
  socialTwitter: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid Twitter URL"),
  socialInstagram: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid Instagram URL"),
  socialYoutube: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid YouTube URL"),
  socialWebsite: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid website URL"),
  socialWhatsapp: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || isValidWhatsAppNumber(value), "Invalid WhatsApp number"),
  socialWhatsappMessage: z.string().trim().max(500).optional().or(z.literal("")),
})

export async function PUT(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:store-social-links:${ip}`, windowMs: 60 * 1000, max: 60 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "update_store_settings")
    if (!access.ok) return access.response

    const body = await req.json()
    const { socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialWebsite, socialWhatsapp, socialWhatsappMessage } =
      socialLinksSchema.parse(body)

    const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(() => null)
    const username = user?.username?.trim().toLowerCase() || ""

    const result = await convexMutation<
      {
        userId: string
        socialFacebook?: string
        socialTwitter?: string
        socialInstagram?: string
        socialYoutube?: string
        socialWebsite?: string
        socialWhatsapp?: string
        socialWhatsappMessage?: string
      },
      { ok: boolean; message?: string; code?: string }
    >("users:updateSocialLinks", {
      userId: session.user.id,
      socialFacebook: socialFacebook || "",
      socialTwitter: socialTwitter || "",
      socialInstagram: socialInstagram || "",
      socialYoutube: socialYoutube || "",
      socialWebsite: socialWebsite || "",
      socialWhatsapp: socialWhatsapp || "",
      socialWhatsappMessage: socialWhatsappMessage || "",
    })

    if (!result.ok) {
      const status = result.code === "SUBSCRIPTION_REQUIRED" ? 402 : 400
      return NextResponse.json({ message: result.message || "Failed to update social links", code: result.code || "" }, { status })
    }

    if (username) {
      revalidateTag(getStoreCacheTag(username), "max")
    }

    return NextResponse.json({ message: "Social links updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Social links update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
