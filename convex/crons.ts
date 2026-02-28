import { cronJobs, makeFunctionReference } from "convex/server"

const crons = cronJobs()

const runScheduledHealthCheck = makeFunctionReference<"action", { limit?: number }, { ok: boolean }>(
  "linkHealth:runScheduledHealthCheck",
)
const expireDueSubscriptions = makeFunctionReference<"mutation", { limit?: number }, { ok: boolean; expired: number }>(
  "subscriptions:expireDueSubscriptions",
)

crons.interval("link-health-check", { hours: 6 }, runScheduledHealthCheck, {
  limit: 120,
})
crons.interval("subscription-expiry-reconciliation", { hours: 1 }, expireDueSubscriptions, {
  limit: 500,
})

export default crons
