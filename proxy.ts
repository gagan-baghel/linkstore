import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { AUTH_JWT_AUDIENCE, AUTH_JWT_ISSUER, getAuthCookieName, getAuthJwtSecret } from "@/lib/auth-config"
import { verifyJwtToken } from "@/lib/jwt"

type SessionTokenPayload = {
  sub: string
  sv: number
  iat: number
  exp: number
  iss: string
  aud: string
}

function isProtectedRoute(req: NextRequest) {
  return req.nextUrl.pathname.startsWith("/dashboard")
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

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/auth/login", req.url)
  return NextResponse.redirect(loginUrl)
}

export default async function proxy(req: NextRequest) {
  if (!isProtectedRoute(req)) {
    return NextResponse.next()
  }

  const token = req.cookies.get(getAuthCookieName())?.value
  if (!token) {
    return redirectToLogin(req)
  }

  const payload = await verifyJwtToken<SessionTokenPayload>(token, getAuthJwtSecret())
  if (!isValidSessionPayload(payload)) {
    return redirectToLogin(req)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
