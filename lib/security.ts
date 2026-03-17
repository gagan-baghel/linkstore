import { NextResponse } from "next/server"

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  key: string
  windowMs: number
  max: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

type RateLimitStore = {
  check: (options: RateLimitOptions) => Promise<RateLimitResult> | RateLimitResult
}

declare global {
  // eslint-disable-next-line no-var
  var __linkstoreRateLimitStore: Map<string, RateLimitEntry> | undefined
  // eslint-disable-next-line no-var
  var __linkstoreRateLimitBackend: RateLimitStore | undefined
}

function getRateLimitStore() {
  if (!global.__linkstoreRateLimitStore) {
    global.__linkstoreRateLimitStore = new Map<string, RateLimitEntry>()
  }
  return global.__linkstoreRateLimitStore
}

function maybeCleanupExpiredEntries(store: Map<string, RateLimitEntry>, now: number) {
  if (store.size < 2000) return
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  return { url: url.replace(/\/+$/, ""), token }
}

async function upstashCommand<T = any>(command: any[], config: { url: string; token: string }) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Upstash request failed: ${response.status}`)
  }

  const data = await response.json()
  return data?.result as T
}

async function upstashPipeline<T = any[]>(commands: any[][], config: { url: string; token: string }) {
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Upstash pipeline failed: ${response.status}`)
  }

  const data = await response.json()
  return (Array.isArray(data) ? data : []).map((item) => item?.result) as T
}

function getRateLimitBackend(): RateLimitStore {
  if (global.__linkstoreRateLimitBackend) {
    return global.__linkstoreRateLimitBackend
  }

  const upstash = getUpstashConfig()
  if (upstash) {
    const backend: RateLimitStore = {
      check: async (options) => {
        const now = Date.now()
        const key = `rl:${options.key}`

        const [countRaw, ttlRaw] = await upstashPipeline<[number, number]>(
          [
            ["INCR", key],
            ["PTTL", key],
          ],
          upstash,
        )

        const count = Number(countRaw || 0)
        let ttlMs = Number(ttlRaw || -1)

        if (!Number.isFinite(ttlMs) || ttlMs < 0) {
          try {
            await upstashCommand(["PEXPIRE", key, options.windowMs], upstash)
            ttlMs = options.windowMs
          } catch {
            ttlMs = options.windowMs
          }
        }

        const allowed = count <= options.max
        const remaining = Math.max(options.max - count, 0)
        const retryAfterSec = Math.max(Math.ceil(ttlMs / 1000), 1)

        return { allowed, remaining, retryAfterSec }
      },
    }

    global.__linkstoreRateLimitBackend = backend
    return backend
  }

  const memoryBackend: RateLimitStore = {
    check: (options) => {
      const now = Date.now()
      const store = getRateLimitStore()
      maybeCleanupExpiredEntries(store, now)

      const current = store.get(options.key)

      if (!current || current.resetAt <= now) {
        store.set(options.key, {
          count: 1,
          resetAt: now + options.windowMs,
        })

        return {
          allowed: true,
          remaining: Math.max(options.max - 1, 0),
          retryAfterSec: Math.ceil(options.windowMs / 1000),
        }
      }

      current.count += 1
      store.set(options.key, current)

      const allowed = current.count <= options.max
      const remaining = Math.max(options.max - current.count, 0)
      const retryAfterSec = Math.max(Math.ceil((current.resetAt - now) / 1000), 1)

      return { allowed, remaining, retryAfterSec }
    },
  }

  global.__linkstoreRateLimitBackend = memoryBackend
  return memoryBackend
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim() || ""
    if (first) return first.slice(0, 100)
  }

  const realIp = headers.get("x-real-ip")?.trim()
  if (realIp) return realIp.slice(0, 100)

  return "anonymous"
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const backend = getRateLimitBackend()
  try {
    const result = backend.check(options)
    if (result instanceof Promise) {
      throw new Error("Async rate limit backend not supported in sync path.")
    }
    return result
  } catch {
    const fallback = getRateLimitStore()
    const now = Date.now()
    maybeCleanupExpiredEntries(fallback, now)

    const current = fallback.get(options.key)

    if (!current || current.resetAt <= now) {
      fallback.set(options.key, {
        count: 1,
        resetAt: now + options.windowMs,
      })

      return {
        allowed: true,
        remaining: Math.max(options.max - 1, 0),
        retryAfterSec: Math.ceil(options.windowMs / 1000),
      }
    }

    current.count += 1
    fallback.set(options.key, current)

    const allowed = current.count <= options.max
    const remaining = Math.max(options.max - current.count, 0)
    const retryAfterSec = Math.max(Math.ceil((current.resetAt - now) / 1000), 1)

    return { allowed, remaining, retryAfterSec }
  }
}

export async function checkRateLimitAsync(options: RateLimitOptions): Promise<RateLimitResult> {
  const backend = getRateLimitBackend()
  try {
    return await backend.check(options)
  } catch {
    return checkRateLimit(options)
  }
}

export function tooManyRequests(retryAfterSec: number) {
  return NextResponse.json(
    { message: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  )
}

function normalizeOrigin(value: string): string | null {
  try {
    const parsed = new URL(value)
    return `${parsed.protocol}//${parsed.host}`.toLowerCase()
  } catch {
    return null
  }
}

function getExpectedOrigin(headers: Headers): string | null {
  const host = headers.get("x-forwarded-host") || headers.get("host")
  if (!host) return null

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const protocol = forwardedProto || (process.env.NODE_ENV === "development" ? "http" : "https")

  return normalizeOrigin(`${protocol}://${host}`)
}

function getAllowedOrigins(expectedOrigin: string | null): Set<string> {
  const allowed = new Set<string>()
  if (expectedOrigin) allowed.add(expectedOrigin)

  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  for (const origin of configured) {
    const normalized = normalizeOrigin(origin)
    if (normalized) allowed.add(normalized)
  }

  return allowed
}

export function enforceSameOrigin(req: Request): NextResponse | null {
  const expectedOrigin = getExpectedOrigin(req.headers)
  const allowedOrigins = getAllowedOrigins(expectedOrigin)

  const originHeader = req.headers.get("origin")
  if (originHeader) {
    const normalizedOrigin = normalizeOrigin(originHeader)
    if (!normalizedOrigin || !allowedOrigins.has(normalizedOrigin)) {
      return NextResponse.json({ message: "Cross-site request blocked." }, { status: 403 })
    }
    return null
  }

  const refererHeader = req.headers.get("referer")
  if (refererHeader) {
    const normalizedReferer = normalizeOrigin(refererHeader)
    if (!normalizedReferer || !allowedOrigins.has(normalizedReferer)) {
      return NextResponse.json({ message: "Cross-site request blocked." }, { status: 403 })
    }
    return null
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Missing request origin." }, { status: 403 })
  }

  return null
}
