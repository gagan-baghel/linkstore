import { mutationGeneric, queryGeneric } from "convex/server"
import { v } from "convex/values"

export const record = mutationGeneric({
  args: {
    actorType: v.union(v.literal("system"), v.literal("user"), v.literal("admin"), v.literal("webhook")),
    actorUserId: v.optional(v.id("users")),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    status: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    await ctx.db.insert("auditLogs", {
      actorType: args.actorType,
      actorUserId: args.actorUserId,
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      status: args.status,
      ip: args.ip || "",
      userAgent: args.userAgent || "",
      details: args.details || "",
      createdAt: now,
    })

    return { ok: true }
  },
})

export const listByActor = queryGeneric({
  args: {
    actorUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("auditLogs")
      .withIndex("by_actorUserId_createdAt", (q) => q.eq("actorUserId", args.actorUserId))
      .order("desc")
      .collect()

    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
    return docs.slice(0, limit)
  },
})

export const consumeRateLimit = mutationGeneric({
  args: {
    key: v.string(),
    windowMs: v.number(),
    max: v.number(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const effectiveWindowMs = Math.max(args.windowMs, 1000)
    const windowStart = now - effectiveWindowMs
    const attempts = await ctx.db
      .query("auditLogs")
      .withIndex("by_action_createdAt", (q) => q.eq("action", `ratelimit:${args.key}`))
      .filter((q) => q.gte(q.field("createdAt"), windowStart))
      .collect()

    const recentCount = attempts.length

    const allowed = recentCount < args.max
    await ctx.db.insert("auditLogs", {
      actorType: "system",
      actorUserId: undefined,
      action: `ratelimit:${args.key}`,
      resourceType: "ratelimit",
      resourceId: undefined,
      status: allowed ? "allowed" : "blocked",
      ip: args.ip || "",
      userAgent: args.userAgent || "",
      details: "",
      createdAt: now,
    })

    const oldestAttempt = attempts[0]
    const retryAfterSec = allowed
      ? Math.max(Math.ceil(effectiveWindowMs / 1000), 1)
      : Math.max(Math.ceil(((oldestAttempt?.createdAt ?? now) + effectiveWindowMs - now) / 1000), 1)

    return {
      allowed,
      remaining: Math.max(args.max - (recentCount + 1), 0),
      retryAfterSec,
    }
  },
})
