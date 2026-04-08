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

const storeSchema = z.object({
  storeBannerText: z.string().trim().min(2).max(120).optional(),
  storeBio: z.string().trim().max(500).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(200).optional().or(z.literal("")),
  storeLogo: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Boolean(tryNormalizeAffiliateUrl(value)), "Invalid logo URL"),
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
  leadCaptureChannel: z.enum(["email", "whatsapp"]).optional(),
  themeMode: z.enum(["light", "dark"]).optional(),
  themePrimaryColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value), "Invalid primary color"),
  themeAccentColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value), "Invalid accent color"),
  themeButtonStyle: z.enum(["pill", "rounded", "square"]).optional(),
  themeCardStyle: z.enum(["soft", "outline", "solid"]).optional(),
  themeFooterVisible: z.boolean().optional(),
  themeBackgroundColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value), "Invalid background color"),
  themeBackgroundPattern: z
    .enum([
      "solid",
      "gradient",
      "mesh",
      "confetti",
      "grid",
      "waves",
      "aurora",
      "sunset",
      "neon",
      "paper",
      "dots",
      "stripes",
      "topo",
      "noise",
      "zigzag",
      "halftone",
      "ripple",
      "petals",
      "diagonal",
      "stars",
      "gradient-radial",
      "glow",
      "checkers",
      "chevron",
      "blobs",
      "prism",
      "lava",
      "hologram",
      "blocks",
      "glyphs",
      "pixel",
      "tartan",
      "arches",
      "swoosh",
      "orbit",
      "ribbon",
      "bubble",
      "petal-arc",
    ])
    .optional(),
  themeNameColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value), "Invalid name color"),
  themeBioColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value), "Invalid bio color"),
  themeNameFont: z
    .enum([
      "system",
      "serif",
      "grotesk",
      "rounded",
      "mono",
      "display",
      "condensed",
      "elegant",
      "handwritten",
      "modern",
      "soft",
      "editorial",
      "tech",
      "classic",
      "headline",
    ])
    .optional(),
  themeBioFont: z
    .enum([
      "system",
      "serif",
      "grotesk",
      "rounded",
      "mono",
      "display",
      "condensed",
      "elegant",
      "handwritten",
      "modern",
      "soft",
      "editorial",
      "tech",
      "classic",
      "headline",
    ])
    .optional(),
})

export async function PUT(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:store:${ip}`, windowMs: 60 * 1000, max: 60 })
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
    const onboardingInProgress = user?.onboardingCompleted === false
    if (!onboardingInProgress) {
      const access = await requireActiveSubscription(session.user.id, "update_store_settings")
      if (!access.ok) return access.response
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
      socialWhatsapp,
      socialWhatsappMessage,
      leadCaptureChannel,
      themeMode,
      themePrimaryColor,
      themeAccentColor,
      themeButtonStyle,
      themeCardStyle,
      themeFooterVisible,
      themeBackgroundColor,
      themeBackgroundPattern,
      themeNameColor,
      themeBioColor,
      themeNameFont,
      themeBioFont,
    } = storeSchema.parse(body)
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
        socialWhatsapp?: string
        socialWhatsappMessage?: string
        leadCaptureChannel?: "email" | "whatsapp"
        themeMode?: "light" | "dark"
        themePrimaryColor?: string
        themeAccentColor?: string
        themeButtonStyle?: "pill" | "rounded" | "square"
        themeCardStyle?: "soft" | "outline" | "solid"
        themeFooterVisible?: boolean
        themeBackgroundColor?: string
        themeBackgroundPattern?:
          | "solid"
          | "gradient"
          | "mesh"
          | "confetti"
          | "grid"
          | "waves"
          | "aurora"
          | "sunset"
          | "neon"
          | "paper"
          | "dots"
          | "stripes"
          | "topo"
          | "noise"
          | "zigzag"
          | "halftone"
          | "ripple"
          | "petals"
          | "diagonal"
          | "stars"
          | "gradient-radial"
          | "glow"
          | "checkers"
          | "chevron"
          | "blobs"
          | "prism"
          | "lava"
          | "hologram"
          | "blocks"
          | "glyphs"
          | "pixel"
          | "tartan"
          | "arches"
          | "swoosh"
          | "orbit"
          | "ribbon"
          | "bubble"
          | "petal-arc"
        themeNameColor?: string
        themeBioColor?: string
        themeNameFont?:
          | "system"
          | "serif"
          | "grotesk"
          | "rounded"
          | "mono"
          | "display"
          | "condensed"
          | "elegant"
          | "handwritten"
          | "modern"
          | "soft"
          | "editorial"
          | "tech"
          | "classic"
          | "headline"
        themeBioFont?:
          | "system"
          | "serif"
          | "grotesk"
          | "rounded"
          | "mono"
          | "display"
          | "condensed"
          | "elegant"
          | "handwritten"
          | "modern"
          | "soft"
          | "editorial"
          | "tech"
          | "classic"
          | "headline"
      },
      { ok: boolean; message?: string; code?: string }
    >("users:updateStore", {
      userId: session.user.id,
      storeBannerText: storeBannerText ?? user?.storeBannerText ?? "Store",
      storeBio: storeBio ?? user?.storeBio ?? "",
      contactInfo: contactInfo ?? user?.contactInfo ?? "",
      storeLogo: storeLogo ?? user?.storeLogo ?? "",
      socialFacebook: socialFacebook ?? user?.socialFacebook ?? "",
      socialTwitter: socialTwitter ?? user?.socialTwitter ?? "",
      socialInstagram: socialInstagram ?? user?.socialInstagram ?? "",
      socialYoutube: socialYoutube ?? user?.socialYoutube ?? "",
      socialWebsite: socialWebsite ?? user?.socialWebsite ?? "",
      socialWhatsapp: socialWhatsapp ?? user?.socialWhatsapp ?? "",
      socialWhatsappMessage: socialWhatsappMessage ?? user?.socialWhatsappMessage ?? "",
      leadCaptureChannel: leadCaptureChannel ?? user?.leadCaptureChannel ?? "email",
      themeMode: themeMode ?? user?.themeMode ?? "light",
      themePrimaryColor: themePrimaryColor ?? user?.themePrimaryColor ?? "",
      themeAccentColor: themeAccentColor ?? user?.themeAccentColor ?? "",
      themeButtonStyle: themeButtonStyle ?? user?.themeButtonStyle ?? "pill",
      themeCardStyle: themeCardStyle ?? user?.themeCardStyle ?? "soft",
      themeFooterVisible: themeFooterVisible ?? user?.themeFooterVisible ?? true,
      themeBackgroundColor: themeBackgroundColor ?? user?.themeBackgroundColor ?? "",
      themeBackgroundPattern: themeBackgroundPattern ?? user?.themeBackgroundPattern ?? "solid",
      themeNameColor: themeNameColor ?? user?.themeNameColor ?? "",
      themeBioColor: themeBioColor ?? user?.themeBioColor ?? "",
      themeNameFont: themeNameFont ?? user?.themeNameFont ?? "system",
      themeBioFont: themeBioFont ?? user?.themeBioFont ?? "system",
    })

    if (!result.ok) {
      const status = result.code === "SUBSCRIPTION_REQUIRED" ? 402 : 400
      return NextResponse.json({ message: result.message || "Failed to update store", code: result.code || "" }, { status })
    }

    if (username) {
      revalidateTag(getStoreCacheTag(username))
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
