import type { Session } from "next-auth"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getSafeServerSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : String(error)
      console.warn("Session read failed; treating request as signed out:", message)
    }
    return null
  }
}
