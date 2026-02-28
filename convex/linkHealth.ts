"use node"

import { actionGeneric, makeFunctionReference } from "convex/server"
import { v } from "convex/values"

type HealthResult = {
  isHealthy: boolean
  status?: number
  error?: string
}

function isDefinitivelyBrokenStatus(status: number) {
  return status === 404 || status === 410 || status === 451
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" })
  } finally {
    clearTimeout(timer)
  }
}

async function checkAffiliateUrl(affiliateUrl: string): Promise<HealthResult> {
  try {
    new URL(affiliateUrl)
  } catch {
    return { isHealthy: false, error: "Invalid URL format" }
  }

  const baseHeaders = {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    accept: "text/html,application/xhtml+xml",
  }

  try {
    const headResponse = await fetchWithTimeout(affiliateUrl, { method: "HEAD", headers: baseHeaders }, 10000)
    if (headResponse.ok) {
      return { isHealthy: true, status: headResponse.status }
    }

    if (headResponse.status === 405 || headResponse.status === 501) {
      const getResponse = await fetchWithTimeout(affiliateUrl, { method: "GET", headers: baseHeaders }, 12000)
      if (getResponse.ok) {
        return { isHealthy: true, status: getResponse.status }
      }

      if (getResponse.status === 401 || getResponse.status === 403 || getResponse.status === 429) {
        return { isHealthy: true, status: getResponse.status }
      }

      return {
        isHealthy: false,
        status: getResponse.status,
        error: isDefinitivelyBrokenStatus(getResponse.status)
          ? `Link returned ${getResponse.status}`
          : `Transient error ${getResponse.status}`,
      }
    }

    if (headResponse.status === 401 || headResponse.status === 403 || headResponse.status === 429) {
      return { isHealthy: true, status: headResponse.status }
    }

    return {
      isHealthy: false,
      status: headResponse.status,
      error: isDefinitivelyBrokenStatus(headResponse.status)
        ? `Link returned ${headResponse.status}`
        : `Transient error ${headResponse.status}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error"
    return { isHealthy: false, error: message }
  }
}

export const runScheduledHealthCheck = actionGeneric({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const listCandidatesRef = makeFunctionReference<"query", { limit?: number }, any[]>("products:listHealthCheckCandidates")
    const setLinkHealthRef = makeFunctionReference<
      "mutation",
      {
        productId: string
        isHealthy: boolean
        status?: number
        error?: string
        checkedAt?: number
      },
      { ok: boolean; message?: string }
    >("products:setLinkHealthById")

    const candidates = await ctx.runQuery(listCandidatesRef, { limit: args.limit ?? 120 })

    let checked = 0
    let healthy = 0
    let broken = 0

    for (const product of candidates) {
      const result = await checkAffiliateUrl(product.affiliateUrl)
      await ctx.runMutation(setLinkHealthRef, {
        productId: product._id,
        isHealthy: result.isHealthy,
        status: result.status,
        error: result.error || "",
        checkedAt: Date.now(),
      })

      checked += 1
      if (result.isHealthy) {
        healthy += 1
      } else {
        broken += 1
      }
    }

    return { ok: true, checked, healthy, broken }
  },
})
