import { NextResponse } from "next/server"
import { z } from "zod"

import { applySessionCookie } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"
import { hashPassword, validatePasswordPolicy } from "@/lib/passwords"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

export const runtime = "nodejs"

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(1).max(256),
})

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:auth:register:${ip}`, windowMs: 10 * 60 * 1000, max: 6 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)
    const passwordError = validatePasswordPolicy(password)

    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const result = await convexMutation<
      { email: string; name: string; passwordHash: string },
      { ok: boolean; message?: string; user?: any }
    >("users:createLocalUser", {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash,
    })

    if (!result.ok || !result.user?._id) {
      return NextResponse.json({ message: result.message || "Unable to create account." }, { status: 409 })
    }

    const authVersion = typeof result.user.authVersion === "number" && result.user.authVersion > 0 ? result.user.authVersion : 1
    const response = NextResponse.json({ message: "Account created successfully." }, { status: 201 })
    await applySessionCookie(response, { userId: result.user._id, authVersion })
    return response
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid registration payload.", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
