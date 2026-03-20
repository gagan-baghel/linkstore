import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

import { isSubscriptionActiveRecord, resolveStoreEnabled } from "../lib/subscription-billing"
import {
  USERNAME_MAX_LENGTH,
  getUsernameValidationMessage,
  isValidUsername,
  normalizeUsernameInput,
  toUsernameBase,
} from "../lib/username"

const PLAN_CODE = "starter_monthly_149"
const PLAN_AMOUNT_PAISE = 14900
const PLAN_CURRENCY = "INR"

function withoutPassword(user: any) {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

function getDisplayName(name: string, email: string) {
  const trimmedName = name.trim()
  if (trimmedName) return trimmedName
  return email.split("@")[0] || "User"
}

function buildUserDefaults(input: {
  name: string
  email: string
  googleSub: string
  image?: string
  now: number
  username: string
}) {
  return {
    name: input.name,
    username: input.username,
    email: input.email,
    googleSub: input.googleSub,
    authProvider: "google" as const,
    emailVerified: true,
    authVersion: 1,
    role: "user" as const,
    image: input.image || "",
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
    socialWhatsapp: "",
    socialWhatsappMessage: "",
    createdAt: input.now,
    updatedAt: input.now,
  }
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
  return isSubscriptionActiveRecord(rows[0], Date.now())
}

export const getByEmail = queryGeneric({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", normalizedEmail)).first()
    return withoutPassword(user)
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

    if (!user) return null

    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect()

    if (rows.length !== 1) return null

    const hasActiveSubscription = isSubscriptionActiveRecord(rows[0], Date.now())
    if (!resolveStoreEnabled({ userStoreEnabled: user.storeEnabled, hasActiveSubscription })) {
      return null
    }

    return { _id: user._id, username: user.username }
  },
})

export const upsertGoogleUser = mutationGeneric({
  args: {
    googleSub: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.emailVerified) {
      return { ok: false, message: "Google email is not verified." as const }
    }

    const normalizedEmail = args.email.trim().toLowerCase()
    const resolvedName = getDisplayName(args.name, normalizedEmail)
    const image = (args.image || "").trim()
    const now = Date.now()

    const existingByGoogle = await ctx.db
      .query("users")
      .withIndex("by_googleSub", (q: any) => q.eq("googleSub", args.googleSub))
      .first()

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", normalizedEmail))
      .first()

    if (existingByGoogle) {
      if (existingByEmail && existingByEmail._id !== existingByGoogle._id) {
        return { ok: false, message: "Email is already linked to another account." as const }
      }

      await ctx.db.patch(existingByGoogle._id, {
        name: resolvedName,
        email: normalizedEmail,
        googleSub: args.googleSub,
        authProvider: "google",
        emailVerified: true,
        passwordHash: undefined,
        image: image || existingByGoogle.image || "",
        updatedAt: now,
      })

      const updatedUser = await ctx.db.get(existingByGoogle._id)
      return { ok: true, user: withoutPassword(updatedUser) }
    }

    if (existingByEmail) {
      if (existingByEmail.googleSub && existingByEmail.googleSub !== args.googleSub) {
        return { ok: false, message: "Email is already linked to another Google account." as const }
      }

      await ctx.db.patch(existingByEmail._id, {
        name: resolvedName,
        googleSub: args.googleSub,
        authProvider: "google",
        emailVerified: true,
        passwordHash: undefined,
        image: image || existingByEmail.image || "",
        updatedAt: now,
      })

      const updatedUser = await ctx.db.get(existingByEmail._id)
      return { ok: true, user: withoutPassword(updatedUser) }
    }

    const generatedUsername = await generateUniqueUsername(ctx, resolvedName)
    const userId = await ctx.db.insert(
      "users",
      buildUserDefaults({
        name: resolvedName,
        email: normalizedEmail,
        googleSub: args.googleSub,
        image,
        now,
        username: generatedUsername,
      }),
    )

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

export const rotateAuthVersion = mutationGeneric({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    const nextAuthVersion = typeof user.authVersion === "number" && user.authVersion > 0 ? user.authVersion + 1 : 2

    await ctx.db.patch(args.userId, {
      authVersion: nextAuthVersion,
      updatedAt: Date.now(),
    })

    const updatedUser = await ctx.db.get(args.userId)
    return { ok: true, authVersion: nextAuthVersion, user: withoutPassword(updatedUser) }
  },
})

export const updateAccount = mutationGeneric({
  args: {
    userId: v.id("users"),
    name: v.string(),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    storeLogo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    const normalizedUsername = normalizeUsernameInput(args.username || user.username || "")
    if (!isValidUsername(normalizedUsername)) {
      return { ok: false, message: getUsernameValidationMessage(normalizedUsername) || "Invalid username." as const }
    }

    const existingByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", normalizedUsername))
      .first()

    if (existingByUsername && existingByUsername._id !== args.userId) {
      return { ok: false, message: "That username is already taken." as const, code: "USERNAME_TAKEN" as const }
    }

    await ctx.db.patch(args.userId, {
      name: args.name,
      username: normalizedUsername.slice(0, USERNAME_MAX_LENGTH),
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
    socialWhatsapp: v.optional(v.string()),
    socialWhatsappMessage: v.optional(v.string()),
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
      socialWhatsapp: args.socialWhatsapp || "",
      socialWhatsappMessage: args.socialWhatsappMessage || "",
      updatedAt: Date.now(),
    })

    return { ok: true }
  },
})

export const updateSocialLinks = mutationGeneric({
  args: {
    userId: v.id("users"),
    socialFacebook: v.optional(v.string()),
    socialTwitter: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
    socialYoutube: v.optional(v.string()),
    socialWebsite: v.optional(v.string()),
    socialWhatsapp: v.optional(v.string()),
    socialWhatsappMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    const hasPremiumAccess = await hasActiveSubscription(ctx, args.userId)
    if (!hasPremiumAccess) {
      return { ok: false, message: "Active subscription required for social link changes" as const, code: "SUBSCRIPTION_REQUIRED" as const }
    }

    await ctx.db.patch(args.userId, {
      socialFacebook: args.socialFacebook || "",
      socialTwitter: args.socialTwitter || "",
      socialInstagram: args.socialInstagram || "",
      socialYoutube: args.socialYoutube || "",
      socialWebsite: args.socialWebsite || "",
      socialWhatsapp: args.socialWhatsapp || "",
      socialWhatsappMessage: args.socialWhatsappMessage || "",
      updatedAt: Date.now(),
    })

    return { ok: true }
  },
})
