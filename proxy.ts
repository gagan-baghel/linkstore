import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { AUTH_JWT_AUDIENCE, AUTH_JWT_ISSUER, getAuthCookieName, getAuthJwtSecret } from "@/lib/auth-config"
import { verifyJwtToken } from "@/lib/jwt"
import { extractStoreUsernameFromHostname } from "@/lib/storefront-url"

type SessionTokenPayload = {
  sub: string
  sv: number
  iat: number
  exp: number
  iss: string
  aud: string
}

function isValidSessionPayload(
  payload: Awaited<ReturnType<typeof verifyJwtToken<SessionTokenPayload>>>,
): payload is SessionTokenPayload {
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

function sanitizeNextPath(input: string) {
  const trimmed = input.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/dashboard"
  return trimmed
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/auth/login", req.url)
  const nextPath = sanitizeNextPath(`${req.nextUrl.pathname}${req.nextUrl.search}`)
  loginUrl.searchParams.set("next", nextPath)
  return NextResponse.redirect(loginUrl)
}

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  const hostname = hostHeader.split(":")[0] || ""
  const storefrontUsername = extractStoreUsernameFromHostname(hostname)

  if (storefrontUsername && (pathname === "/store" || pathname === "/")) {
    const rewrittenUrl = req.nextUrl.clone()
    rewrittenUrl.pathname = `/${storefrontUsername}`
    return NextResponse.rewrite(rewrittenUrl)
  }

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  const token = req.cookies.get(getAuthCookieName())?.value
  if (!token) {
    return redirectToLogin(req)
  }

  let secret = ""
  try {
    secret = getAuthJwtSecret()
  } catch {
    return redirectToLogin(req)
  }

  const payload = await verifyJwtToken<SessionTokenPayload>(token, secret)
  if (!isValidSessionPayload(payload)) {
    return redirectToLogin(req)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/((?!api|_next|.*\\..*).*)"],
}
