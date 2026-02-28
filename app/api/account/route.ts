import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation, convexQuery } from "@/lib/convex"
import { getStoreCacheTag } from "@/lib/store-cache"

const accountSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  image: z.string().optional(),
  storeLogo: z.string().optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, image, storeLogo } = accountSchema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(
      () => null,
    )
    const previousUsername = existingUser?.username?.trim().toLowerCase() || ""

    const result = await convexMutation<
      { userId: string; name: string; email: string; image?: string; storeLogo?: string },
      { ok: boolean; message?: string }
    >("users:updateAccount", {
      userId: session.user.id,
      name,
      email: normalizedEmail,
      image,
      storeLogo,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Failed to update account" }, { status: 409 })
    }

    if (previousUsername) {
      revalidateTag(getStoreCacheTag(previousUsername), "max")
    }

    return NextResponse.json({ message: "Account updated successfully" })
  } catch (error) {
    console.error("Account update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
