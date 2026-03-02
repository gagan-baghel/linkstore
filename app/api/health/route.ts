import { NextResponse } from "next/server"

import { getRuntimeReadinessChecks } from "@/lib/runtime-config"

export async function GET() {
  const checks = getRuntimeReadinessChecks()
  const requiredFailures = checks.filter((check) => check.required && !check.configured)
  const ok = requiredFailures.length === 0

  return NextResponse.json(
    {
      ok,
      status: ok ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      requiredFailures: requiredFailures.map((failure) => failure.key),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
