import { NextRequest, NextResponse } from "next/server"

import { applySessionCookie } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"
import { sanitizePostAuthPath } from "@/lib/google-auth"

export const runtime = "nodejs"

function redirectToLogin(req: NextRequest, error: string) {
  const url = new URL("/auth/login", req.url)
  url.searchParams.set("error", error)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Temporary dev login is disabled in production." }, { status: 404 })
  }

  try {
    const nextPath = sanitizePostAuthPath(req.nextUrl.searchParams.get("next"))

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
      googleSub: "dev-temp-login",
      email: "dev@affiliatehub.local",
      emailVerified: true,
      name: "Dev User",
      image: "",
    })

    if (!result.ok || !result.user?._id) {
      return redirectToLogin(req, "dev_login_failed")
    }

    const authVersion =
      typeof result.user.authVersion === "number" && result.user.authVersion > 0 ? result.user.authVersion : 1

    const response = NextResponse.redirect(new URL(nextPath, req.url))
    await applySessionCookie(response, { userId: result.user._id, authVersion })
    return response
  } catch (error) {
    console.error("Dev login error:", error)
    return redirectToLogin(req, "dev_login_failed")
  }
}
