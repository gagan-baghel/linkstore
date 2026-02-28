import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

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

export const getForAuthByEmail = queryGeneric({
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

export const getForAuthById = queryGeneric({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

export const createUser = mutationGeneric({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase()

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first()
    if (existingByEmail) {
      return { ok: false, message: "User with this email already exists" as const }
    }

    const generatedUsername = await generateUniqueUsername(ctx, args.name)

    const now = Date.now()
    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: generatedUsername,
      email: normalizedEmail,
      passwordHash: args.passwordHash,
      image: "",
      storeBio: "",
      storeBannerText: `${args.name}'s Affiliate Store`,
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

export const updatePassword = mutationGeneric({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
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
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "User not found" as const }
    }

    await ctx.db.patch(args.userId, {
      themePrimaryColor: args.themePrimaryColor,
      themeAccentColor: args.themeAccentColor,
      themeBannerStyle: args.themeBannerStyle,
      themeButtonStyle: args.themeButtonStyle,
      themeCardStyle: args.themeCardStyle,
      updatedAt: Date.now(),
    })

    return { ok: true }
  },
})
