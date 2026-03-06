import { NextResponse } from "next/server"

import { clearSessionCookie } from "@/lib/auth"
import { enforceSameOrigin } from "@/lib/security"

export async function POST(req: Request) {
  const csrfBlock = enforceSameOrigin(req)
  if (csrfBlock) return csrfBlock

  const response = NextResponse.json({ message: "Signed out successfully." })
  clearSessionCookie(response)
  return response
}
