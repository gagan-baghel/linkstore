import { NextResponse } from "next/server"
import { z } from "zod"
import { compare, hash } from "bcrypt"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
})

export async function PUT(req: Request) {
  try {
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = passwordSchema.parse(body)

    const user = await convexQuery<{ userId: string }, any | null>("users:getForAuthById", {
      userId: session.user.id,
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: "User not found or no password set" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10)

    // Update password
    const result = await convexMutation<{ userId: string; passwordHash: string }, { ok: boolean; message?: string }>(
      "users:updatePassword",
      {
        userId: session.user.id,
        passwordHash: hashedPassword,
      },
    )

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Failed to update password" }, { status: 400 })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
