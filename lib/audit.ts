import { convexMutation } from "@/lib/convex"

type AuditActorType = "system" | "user" | "admin" | "webhook"

export async function writeAuditLog(input: {
  actorType: AuditActorType
  actorUserId?: string
  action: string
  resourceType: string
  resourceId?: string
  status: string
  ip?: string
  userAgent?: string
  details?: string
}) {
  try {
    await convexMutation<
      {
        actorType: AuditActorType
        actorUserId?: string
        action: string
        resourceType: string
        resourceId?: string
        status: string
        ip?: string
        userAgent?: string
        details?: string
      },
      { ok: boolean }
    >("auditLogs:record", {
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      status: input.status,
      ip: input.ip,
      userAgent: input.userAgent,
      details: input.details,
    })
  } catch (error) {
    console.error("Audit log write failed:", error)
  }
}
