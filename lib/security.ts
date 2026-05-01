import { NextResponse } from "next/server"

import { convexMutation } from "@/lib/convex"

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

declare global {
  var __linkstoreRateLimitStore: Map<string, RateLimitEntry> | undefined
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

function checkInMemoryRateLimit(options: RateLimitOptions): RateLimitResult {
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
}

function canUseDurableRateLimit() {
  return Boolean(process.env.CONVEX_URL?.trim())
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
  return checkInMemoryRateLimit(options)
}

export async function checkRateLimitAsync(options: RateLimitOptions): Promise<RateLimitResult> {
  if (!canUseDurableRateLimit()) {
    return checkInMemoryRateLimit(options)
  }

  try {
    return await convexMutation<
      {
        key: string
        windowMs: number
        max: number
      },
      RateLimitResult
    >("auditLogs:consumeRateLimit", {
      key: options.key,
      windowMs: options.windowMs,
      max: options.max,
    })
  } catch (error) {
    console.error("Durable rate limit backend failed; falling back to in-memory limiter:", error)
    return checkInMemoryRateLimit(options)
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
