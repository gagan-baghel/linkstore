import { cronJobs, makeFunctionReference } from "convex/server"

const crons = cronJobs()

const runScheduledHealthCheck = makeFunctionReference<"action", { limit?: number }, { ok: boolean }>(
  "linkHealth:runScheduledHealthCheck",
)
const expireDueSubscriptions = makeFunctionReference<"mutation", { limit?: number }, { ok: boolean; expired: number }>(
  "subscriptions:expireDueSubscriptions",
)
const runBillingReconciliation = makeFunctionReference<
  "action",
  { limit?: number; lookbackMs?: number },
  { ok: boolean; status: string; checkedCount: number; reconciledCount: number; flaggedCount: number }
>("billing:runBillingReconciliation")

crons.interval("link-health-check", { hours: 6 }, runScheduledHealthCheck, {
  limit: 120,
})
crons.interval("subscription-expiry-reconciliation", { hours: 1 }, expireDueSubscriptions, {
  limit: 500,
})
crons.interval("billing-reconciliation", { hours: 1 }, runBillingReconciliation, {
  limit: 250,
  lookbackMs: 7 * 24 * 60 * 60 * 1000,
})

export default crons
