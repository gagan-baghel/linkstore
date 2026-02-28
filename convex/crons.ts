import { cronJobs, makeFunctionReference } from "convex/server"

const crons = cronJobs()

const runScheduledHealthCheck = makeFunctionReference<"action", { limit?: number }, { ok: boolean }>(
  "linkHealth:runScheduledHealthCheck",
)

crons.interval("link-health-check", { hours: 6 }, runScheduledHealthCheck, {
  limit: 120,
})

export default crons
