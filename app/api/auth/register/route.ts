import { NextResponse } from "next/server"
import { z } from "zod"
import { hash } from "bcrypt"
import { convexMutation } from "@/lib/convex"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
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
      return NextResponse.json({ message: result.message || "Failed to create user" }, { status: 409 })
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
