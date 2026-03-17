import { NextRequest, NextResponse } from "next/server"

import {
  buildGoogleAuthorizationUrl,
  createOAuthState,
  createPkceChallenge,
  createPkceVerifier,
  getGoogleAuthCookies,
  getGoogleCallbackUrl,
  getGoogleClientId,
  isGoogleAuthConfigured,
  sanitizePostAuthPath,
} from "@/lib/google-auth"
import { checkRateLimitAsync, getClientIp, tooManyRequests } from "@/lib/security"

export const runtime = "nodejs"

function buildLoginErrorRedirect(req: NextRequest, error: string) {
  const redirectUrl = new URL("/auth/login", new URL(req.url).origin)
  redirectUrl.searchParams.set("error", error)
  return redirectUrl
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rate = await checkRateLimitAsync({ key: `api:auth:google:start:${ip}`, windowMs: 60 * 1000, max: 30 })
  if (!rate.allowed) {
    return tooManyRequests(rate.retryAfterSec)
  }

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(buildLoginErrorRedirect(req, "google_not_configured"))
  }

  try {
    const url = new URL(req.url)
    const nextPath = sanitizePostAuthPath(url.searchParams.get("next"))
    const state = createOAuthState()
    const pkceVerifier = createPkceVerifier()
    const codeChallenge = createPkceChallenge(pkceVerifier)
    const cookies = getGoogleAuthCookies()

    const authUrl = buildGoogleAuthorizationUrl({
      clientId: getGoogleClientId(),
      redirectUri: getGoogleCallbackUrl(req),
      state,
      codeChallenge,
    })

    const response = NextResponse.redirect(authUrl)
    response.cookies.set(cookies.state, state, cookies.options)
    response.cookies.set(cookies.pkce, pkceVerifier, cookies.options)
    response.cookies.set(cookies.next, nextPath, cookies.options)
    return response
  } catch (error) {
    console.error("Google auth start error:", error)
    return NextResponse.redirect(buildLoginErrorRedirect(req, "token_exchange_failed"))
  }
}
