import { NextRequest, NextResponse } from "next/server"

import { applySessionCookie } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { convexMutation } from "@/lib/convex"
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getGoogleAuthCookies,
  getGoogleCallbackUrl,
  sanitizePostAuthPath,
} from "@/lib/google-auth"
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/security"

export const runtime = "nodejs"

function clearGoogleAuthCookies(response: NextResponse) {
  const cookies = getGoogleAuthCookies()
  response.cookies.set(cookies.state, "", { ...cookies.options, maxAge: 0 })
  response.cookies.set(cookies.pkce, "", { ...cookies.options, maxAge: 0 })
  response.cookies.set(cookies.next, "", { ...cookies.options, maxAge: 0 })
}

function buildLoginRedirect(req: NextRequest, error: string) {
  const redirectUrl = new URL("/auth/login", new URL(req.url).origin)
  redirectUrl.searchParams.set("error", error)
  return redirectUrl
}

function redirectWithError(req: NextRequest, error: string) {
  const response = NextResponse.redirect(buildLoginRedirect(req, error))
  clearGoogleAuthCookies(response)
  return response
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rate = checkRateLimit({ key: `api:auth:google:callback:${ip}`, windowMs: 60 * 1000, max: 60 })
  if (!rate.allowed) {
    return tooManyRequests(rate.retryAfterSec)
  }

  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const oauthError = url.searchParams.get("error")
  const cookies = getGoogleAuthCookies()
  const expectedState = req.cookies.get(cookies.state)?.value || ""
  const codeVerifier = req.cookies.get(cookies.pkce)?.value || ""
  const nextPath = sanitizePostAuthPath(req.cookies.get(cookies.next)?.value)

  if (oauthError) {
    return redirectWithError(req, oauthError === "access_denied" ? "access_denied" : "token_exchange_failed")
  }

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return redirectWithError(req, "invalid_state")
  }

  try {
    const tokens = await exchangeGoogleCode({
      code,
      codeVerifier,
      redirectUri: getGoogleCallbackUrl(req),
    })

    const profile = await fetchGoogleUserInfo(tokens.access_token)
    if (!profile.email_verified) {
      return redirectWithError(req, "email_not_verified")
    }

    const result = await convexMutation<
      {
        googleSub: string
        email: string
        emailVerified: boolean
        name: string
        image?: string
      },
      { ok: boolean; message?: string; user?: any }
    >("users:upsertGoogleUser", {
      googleSub: profile.sub,
      email: profile.email,
      emailVerified: Boolean(profile.email_verified),
      name: profile.name || "",
      image: profile.picture || "",
    })

    if (!result.ok || !result.user?._id) {
      return redirectWithError(req, "account_link_failed")
    }

    const authVersion = typeof result.user.authVersion === "number" && result.user.authVersion > 0 ? result.user.authVersion : 1
    const destination = new URL(nextPath, new URL(req.url).origin)
    const response = NextResponse.redirect(destination)
    clearGoogleAuthCookies(response)
    await applySessionCookie(response, { userId: result.user._id, authVersion })

    await writeAuditLog({
      actorType: "user",
      actorUserId: result.user._id,
      action: "auth.google_sign_in",
      resourceType: "auth_session",
      status: "ok",
      ip,
      userAgent: req.headers.get("user-agent") || "",
      details: JSON.stringify({ email: profile.email }),
    })

    return response
  } catch (error) {
    console.error("Google auth callback error:", error)
    return redirectWithError(req, "token_exchange_failed")
  }
}
