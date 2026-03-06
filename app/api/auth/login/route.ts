import { NextResponse } from "next/server"
import { z } from "zod"

import { applySessionCookie } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { verifyPassword } from "@/lib/passwords"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

export const runtime = "nodejs"

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(256),
})

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:auth:login:${ip}`, windowMs: 60 * 1000, max: 10 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const user = await convexQuery<{ email: string }, any | null>("users:getAuthByEmail", {
      email: email.trim().toLowerCase(),
    }).catch(() => null)

    const passwordHash = typeof user?.passwordHash === "string" ? user.passwordHash : ""
    const isValid = passwordHash ? await verifyPassword(password, passwordHash) : false

    if (!user?._id || !isValid) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 })
    }

    const authVersion = typeof user.authVersion === "number" && user.authVersion > 0 ? user.authVersion : 1
    const response = NextResponse.json({ message: "Signed in successfully." })
    await applySessionCookie(response, { userId: user._id, authVersion })
    return response
  } catch (error) {
    console.error("Login error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid login payload.", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
