import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

const PLAN_CODE = "starter_monthly_149"
const PLAN_AMOUNT_PAISE = 14900
const PLAN_CURRENCY = "INR"

function withoutPassword(user: any) {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

function toUsernameBase(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (!normalized) return "store"
  return normalized.slice(0, 18)
}

function normalizeUsernameInput(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase()
}

async function generateUniqueUsername(ctx: any, name: string) {
  const base = toUsernameBase(name)

  for (let attempt = 0; attempt < 25; attempt++) {
    const timePart = Date.now().toString(36).slice(-4)
    const randomPart = Math.random().toString(36).slice(2, 6)
    const suffix = `${timePart}${randomPart}`
    const candidate = `${base}-${suffix}`.slice(0, 30)

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", candidate))
      .first()

    if (!existing) return candidate
  }

  throw new Error("Unable to generate a unique username")
}

async function hasActiveSubscription(ctx: any, userId: string) {
  const rows = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect()

  if (rows.length !== 1) return false
  const sub = rows[0]
  return sub.status === "active" && typeof sub.expiresAt === "number" && sub.expiresAt > Date.now()
}

export const getByEmail = queryGeneric({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()
    return await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", normalizedEmail)).first()
  },
})

export const getById = queryGeneric({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    return withoutPassword(user)
  },
})

export const getPublicByUsername = queryGeneric({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizeUsernameInput(args.username)
    if (!normalized) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .first()

    if (!user || user.storeEnabled !== true) return null
    return { _id: user._id, username: user.username }
  },
})

export const upsertFromClerk = mutationGeneric({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()
    const trimmedName = args.name.trim()
    const now = Date.now()
    const resolvedName = trimmedName || normalizedEmail.split("@")[0] || "User"

    const existingByClerkId = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    if (existingByClerkId) {
      const patch: Record<string, any> = {}
      if (!existingByClerkId.clerkUserId) patch.clerkUserId = args.clerkUserId
      if ((!existingByClerkId.image || existingByClerkId.image.trim() === "") && typeof args.image === "string") {
        patch.image = args.image
      }
      if (Object.keys(patch).length > 0) {
        patch.updatedAt = now
        await ctx.db.patch(existingByClerkId._id, patch)
      }
      const user = await ctx.db.get(existingByClerkId._id)
      return { ok: true, user: withoutPassword(user) }
    }

    const existingByEmail = normalizedEmail
      ? await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
          .first()
      : null

    if (existingByEmail) {
      if (existingByEmail.clerkUserId && existingByEmail.clerkUserId !== args.clerkUserId) {
        return { ok: false, message: "Email is already linked to another account" as const }
      }

      const patch: Record<string, any> = {
        clerkUserId: args.clerkUserId,
        updatedAt: now,
      }
      if ((!existingByEmail.image || existingByEmail.image.trim() === "") && typeof args.image === "string") {
        patch.image = args.image
      }
      await ctx.db.patch(existingByEmail._id, patch)

      const user = await ctx.db.get(existingByEmail._id)
      return { ok: true, user: withoutPassword(user) }
    }

    const generatedUsername = await generateUniqueUsername(ctx, resolvedName)
    const userId = await ctx.db.insert("users", {
      name: resolvedName,
      username: generatedUsername,
      email: normalizedEmail,
      passwordHash: undefined,
      clerkUserId: args.clerkUserId,
      role: "user",
      image: args.image || "",
      storeEnabled: false,
      storeCreatedAt: undefined,
      storeBio: "",
      storeBannerText: "Store",
      contactInfo: "",
      storeLogo: "",
      socialFacebook: "",
      socialTwitter: "",
      socialInstagram: "",
      socialYoutube: "",
      socialWebsite: "",
      themePrimaryColor: "#4f46e5",
      themeAccentColor: "#eef2ff",
      themeBannerStyle: "gradient",
      themeButtonStyle: "rounded",
      themeCardStyle: "shadow",
      themeMode: "system",
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert("subscriptions", {
      userId,
      planCode: PLAN_CODE,
      planAmountPaise: PLAN_AMOUNT_PAISE,
      currency: PLAN_CURRENCY,
      status: "inactive",
      currentPeriodStart: undefined,
      currentPeriodEnd: undefined,
      activatedAt: undefined,
      expiresAt: undefined,
      cancelledAt: undefined,
      pendingOrderId: undefined,
      lastOrderId: undefined,
      lastPaymentIdEncrypted: undefined,
      lastPaymentIdHash: "",
      lastSignatureHash: "",
      webhookConfirmedAt: undefined,
      deactivationReason: undefined,
      createdAt: now,
      updatedAt: now,
    })

    const user = await ctx.db.get(userId)
    return { ok: true, user: withoutPassword(user) }
  },
})

export const updateAccount = mutationGeneric({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    storeLogo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()

    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()
    if (existingByEmail && existingByEmail._id !== args.userId) {
      return { ok: false, message: "Email is already in use" as const }
    }

    await ctx.db.patch(args.userId, {
      name: args.name,
      email: normalizedEmail,
      image: args.image ?? user.image ?? "",
      storeLogo: args.storeLogo ?? user.storeLogo ?? "",
      updatedAt: Date.now(),
    })

    const updatedUser = await ctx.db.get(args.userId)
    return { ok: true, user: withoutPassword(updatedUser) }
  },
})

export const updateStore = mutationGeneric({
  args: {
    userId: v.id("users"),
    storeBannerText: v.string(),
    storeBio: v.string(),
    contactInfo: v.optional(v.string()),
    storeLogo: v.optional(v.string()),
    socialFacebook: v.optional(v.string()),
    socialTwitter: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
    socialYoutube: v.optional(v.string()),
    socialWebsite: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    const hasPremiumAccess = await hasActiveSubscription(ctx, args.userId)
    if (!hasPremiumAccess) {
      return { ok: false, message: "Active subscription required for store updates" as const, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    await ctx.db.patch(args.userId, {
      storeBannerText: args.storeBannerText,
      storeBio: args.storeBio,
      contactInfo: args.contactInfo || "",
      storeLogo: args.storeLogo || "",
      socialFacebook: args.socialFacebook || "",
      socialTwitter: args.socialTwitter || "",
      socialInstagram: args.socialInstagram || "",
      socialYoutube: args.socialYoutube || "",
      socialWebsite: args.socialWebsite || "",
      updatedAt: Date.now(),
    })

    return { ok: true }
  },
})

export const updateStoreTheme = mutationGeneric({
  args: {
    userId: v.id("users"),
    themePrimaryColor: v.string(),
    themeAccentColor: v.string(),
    themeBannerStyle: v.string(),
    themeButtonStyle: v.string(),
    themeCardStyle: v.string(),
    themeMode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    const hasPremiumAccess = await hasActiveSubscription(ctx, args.userId)
    if (!hasPremiumAccess) {
      return { ok: false, message: "Active subscription required for store theme changes" as const, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    await ctx.db.patch(args.userId, {
      themePrimaryColor: args.themePrimaryColor,
      themeAccentColor: args.themeAccentColor,
      themeBannerStyle: args.themeBannerStyle,
      themeButtonStyle: args.themeButtonStyle,
      themeCardStyle: args.themeCardStyle,
      themeMode: args.themeMode,
      updatedAt: Date.now(),
    })

    return { ok: true }
  },
})
