import { NextResponse } from "next/server"
import { z } from "zod"

import { applySessionCookie, getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"
import { hashPassword, validatePasswordPolicy, verifyPassword } from "@/lib/passwords"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

export const runtime = "nodejs"

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(1).max(256),
})

export async function PUT(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:auth:password:${ip}`, windowMs: 10 * 60 * 1000, max: 10 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = passwordSchema.parse(body)

    if (currentPassword === newPassword) {
      return NextResponse.json({ message: "Choose a different password." }, { status: 400 })
    }

    const passwordError = validatePasswordPolicy(newPassword)
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 })
    }

    const user = await convexQuery<{ userId: string }, any | null>("users:getAuthById", {
      userId: session.user.id,
    }).catch(() => null)

    const passwordHash = typeof user?.passwordHash === "string" ? user.passwordHash : ""
    const isValid = passwordHash ? await verifyPassword(currentPassword, passwordHash) : false

    if (!user?._id || !isValid) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 401 })
    }

    const nextPasswordHash = await hashPassword(newPassword)
    const result = await convexMutation<
      { userId: string; passwordHash: string },
      { ok: boolean; message?: string; authVersion?: number }
    >("users:updatePassword", {
      userId: session.user.id,
      passwordHash: nextPasswordHash,
    })

    if (!result.ok || !result.authVersion) {
      return NextResponse.json({ message: result.message || "Unable to update password." }, { status: 409 })
    }

    const response = NextResponse.json({
      message: "Password updated successfully. Other sessions have been signed out.",
    })
    await applySessionCookie(response, { userId: session.user.id, authVersion: result.authVersion })
    return response
  } catch (error) {
    console.error("Password update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid password payload.", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
