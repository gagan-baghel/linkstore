import { cache } from "react"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  AUTH_JWT_AUDIENCE,
  AUTH_JWT_ISSUER,
  getAuthCookieName,
  getAuthJwtSecret,
  getAuthSessionTtlSeconds,
  isSecureAuthCookie,
} from "@/lib/auth-config"
import { convexQuery } from "@/lib/convex"
import { signJwtToken, verifyJwtToken } from "@/lib/jwt"

type SessionUser = {
  id: string
  name: string
  email: string
  image?: string
  username?: string
  role?: "user" | "admin"
  subscriptionStatus?: "inactive" | "pending" | "active" | "expired" | "cancelled"
  hasActiveSubscription?: boolean
  subscriptionExpiresAt?: number | null
}

export type SafeSession = {
  user: SessionUser
}

type SessionTokenPayload = {
  sub: string
  sv: number
  iat: number
  exp: number
  iss: string
  aud: string
}

function getSessionCookieConfig(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureAuthCookie(),
    path: "/",
    maxAge,
  }
}

function isValidSessionPayload(payload: Awaited<ReturnType<typeof verifyJwtToken<SessionTokenPayload>>>): payload is SessionTokenPayload {
  return Boolean(
    payload &&
      typeof payload.sub === "string" &&
      payload.sub &&
      typeof payload.sv === "number" &&
      Number.isFinite(payload.sv) &&
      payload.sv > 0 &&
      payload.iss === AUTH_JWT_ISSUER &&
      payload.aud === AUTH_JWT_AUDIENCE,
  )
}

export async function createSessionToken(input: { userId: string; authVersion?: number }) {
  const ttl = getAuthSessionTtlSeconds()
  const now = Math.floor(Date.now() / 1000)

  return signJwtToken(
    {
      sub: input.userId,
      sv: input.authVersion && input.authVersion > 0 ? input.authVersion : 1,
      iat: now,
      exp: now + ttl,
      iss: AUTH_JWT_ISSUER,
      aud: AUTH_JWT_AUDIENCE,
    },
    getAuthJwtSecret(),
  )
}

export async function verifySessionToken(token: string) {
  const payload = await verifyJwtToken<SessionTokenPayload>(token, getAuthJwtSecret())
  return isValidSessionPayload(payload) ? payload : null
}

export async function applySessionCookie(response: NextResponse, input: { userId: string; authVersion?: number }) {
  const ttl = getAuthSessionTtlSeconds()
  const token = await createSessionToken(input)
  response.cookies.set(getAuthCookieName(), token, getSessionCookieConfig(ttl))
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(getAuthCookieName(), "", getSessionCookieConfig(0))
}

const loadSafeServerSession = cache(async (): Promise<SafeSession | null> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(getAuthCookieName())?.value
    if (!token) return null

    const payload = await verifySessionToken(token)
    if (!payload) return null

    const [user, accessState] = await Promise.all([
      convexQuery<{ userId: string }, any | null>("users:getById", { userId: payload.sub }),
      convexQuery<{ userId: string }, any | null>("subscriptions:getAccessState", { userId: payload.sub }).catch(() => null),
    ])

    if (!user?._id) {
      return null
    }

    const authVersion = typeof user.authVersion === "number" && user.authVersion > 0 ? user.authVersion : 1
    if (payload.sv !== authVersion) {
      return null
    }

    return {
      user: {
        id: user._id,
        name: user.name || "User",
        email: user.email || "",
        image: user.image || "",
        username: user.username,
        role: user.role === "admin" ? "admin" : "user",
        subscriptionStatus: accessState?.effectiveStatus || "inactive",
        hasActiveSubscription: Boolean(accessState?.hasActiveSubscription),
        subscriptionExpiresAt: typeof accessState?.expiresAt === "number" ? accessState.expiresAt : null,
      },
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : String(error)
      console.warn("Session read failed; treating request as signed out:", message)
    }
    return null
  }
})

export async function getSafeServerSession(): Promise<SafeSession | null> {
  return loadSafeServerSession()
}
