import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string
      role?: "user" | "admin"
      subscriptionStatus?: "inactive" | "pending" | "active" | "expired" | "cancelled"
      hasActiveSubscription?: boolean
      subscriptionExpiresAt?: number | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    username?: string
    role?: "user" | "admin"
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    username?: string
    role?: "user" | "admin"
    subscriptionStatus?: "inactive" | "pending" | "active" | "expired" | "cancelled"
    hasActiveSubscription?: boolean
    subscriptionExpiresAt?: number | null
    lastSyncedAt?: number
  }
}
