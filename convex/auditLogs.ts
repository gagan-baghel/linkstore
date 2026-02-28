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
