import { cronJobs, makeFunctionReference } from "convex/server"

const crons = cronJobs()

const runScheduledHealthCheck = makeFunctionReference<"action", { limit?: number; _serverSecret?: string }, { ok: boolean }>(
  "linkHealth:runScheduledHealthCheck",
)
const expireDueSubscriptions = makeFunctionReference<
  "mutation",
  { limit?: number; _serverSecret?: string },
  { ok: boolean; expired: number }
>("subscriptions:expireDueSubscriptions")
const runBillingReconciliation = makeFunctionReference<
  "action",
  { limit?: number; lookbackMs?: number; _serverSecret?: string },
  { ok: boolean; status: string; checkedCount: number; reconciledCount: number; flaggedCount: number }
>("billing:runBillingReconciliation")

// Scheduled calls go through the same guarded functions, so they carry the secret.
const _serverSecret = process.env.SERVER_SHARED_SECRET

crons.interval("link-health-check", { hours: 6 }, runScheduledHealthCheck, {
  limit: 120,
  _serverSecret,
})
crons.interval("subscription-expiry-reconciliation", { hours: 1 }, expireDueSubscriptions, {
  limit: 500,
  _serverSecret,
})
crons.interval("billing-reconciliation", { hours: 1 }, runBillingReconciliation, {
  limit: 250,
  lookbackMs: 7 * 24 * 60 * 60 * 1000,
  _serverSecret,
})

export default crons
