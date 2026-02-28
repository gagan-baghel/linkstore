import { NextResponse } from "next/server"
import { z } from "zod"
import { hash } from "bcrypt"
import { convexMutation } from "@/lib/convex"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"

const userSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(128)
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/\d/, "Password must include a number."),
})

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `auth:register:${ip}`, windowMs: 10 * 60 * 1000, max: 10 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const body = await req.json()
    const { name, email, password } = userSchema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()
    const passwordHash = await hash(password, 10)
    const result = await convexMutation<
      {
        name: string
        email: string
        passwordHash: string
      },
      { ok: boolean; message?: string; user?: any }
    >("users:createUser", {
      name,
      email: normalizedEmail,
      passwordHash,
    })

    if (!result.ok) {
      return NextResponse.json({ message: "Unable to create account" }, { status: 409 })
    }

    return NextResponse.json(
      {
        user: {
          id: result.user?._id,
          name: result.user?.name,
          email: result.user?.email,
          username: result.user?.username,
        },
        message: "User created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
