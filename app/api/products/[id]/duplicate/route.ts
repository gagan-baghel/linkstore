import { NextRequest, NextResponse } from "next/server"

import { getSafeServerSession } from "@/lib/auth"
import { convexMutation } from "@/lib/convex"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const result = await convexMutation<
      { productId: string; userId: string },
      { ok: boolean; message?: string; product?: any }
    >("products:duplicateByIdForUser", {
      productId: id,
      userId: session.user.id,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product duplicated", product: result.product }, { status: 201 })
  } catch (error) {
    console.error("Duplicate product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
