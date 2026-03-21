import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

export const createLead = mutationGeneric({
  args: {
    userId: v.id("users"),
    storeUsername: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    consent: v.boolean(),
    source: v.optional(v.string()),
    medium: v.optional(v.string()),
    campaign: v.optional(v.string()),
    content: v.optional(v.string()),
    term: v.optional(v.string()),
    collectionSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { ok: false, message: "Store owner not found" as const }
    }

    if (user.username.trim().toLowerCase() !== args.storeUsername.trim().toLowerCase()) {
      return { ok: false, message: "Store mismatch" as const }
    }

    const email = (args.email || "").trim().toLowerCase()
    const whatsapp = (args.whatsapp || "").trim()

    if (!email && !whatsapp) {
      return { ok: false, message: "Email or WhatsApp is required" as const }
    }

    if (!args.consent) {
      return { ok: false, message: "Consent is required" as const }
    }

    const now = Date.now()

    await ctx.db.insert("audienceLeads", {
      userId: args.userId,
      storeUsername: user.username.trim().toLowerCase(),
      name: (args.name || "").trim(),
      email,
      whatsapp,
      consent: true,
      status: "new",
      source: (args.source || "").trim().toLowerCase(),
      medium: (args.medium || "").trim().toLowerCase(),
      campaign: (args.campaign || "").trim(),
      content: (args.content || "").trim(),
      term: (args.term || "").trim(),
      collectionSlug: (args.collectionSlug || "").trim().toLowerCase(),
      createdAt: now,
      updatedAt: now,
    })

    return { ok: true }
  },
})

export const listByUser = queryGeneric({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("audienceLeads")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    return rows
  },
})
