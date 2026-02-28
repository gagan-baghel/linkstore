import type { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { convexMutation, convexQuery } from "@/lib/convex"
import { getClientIp } from "@/lib/security"

const nextAuthSecret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "development-only-change-before-production" : "")
const nextAuthUrl = process.env.NEXTAUTH_URL?.trim()
const jwtRefreshIntervalMs = 5 * 60 * 1000

if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is required in production.")
}

if (process.env.NODE_ENV === "production" && !nextAuthUrl) {
  throw new Error("NEXTAUTH_URL is required in production.")
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 5 * 60,
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const normalizedEmail = credentials.email.trim().toLowerCase()
          const headers = new Headers(req?.headers || {})
          const ip = getClientIp(headers)
          const userAgent = (headers.get("user-agent") || "").slice(0, 500)
          const rateKey = `auth:login:${ip}:${normalizedEmail}`
          const rate = await convexMutation<
            { key: string; windowMs: number; max: number; ip?: string; userAgent?: string },
            { allowed: boolean; remaining: number; retryAfterSec: number }
          >("auditLogs:consumeRateLimit", {
            key: rateKey,
            windowMs: 10 * 60 * 1000,
            max: 20,
            ip,
            userAgent,
          })
          if (!rate.allowed) {
            throw new Error("RATE_LIMITED")
          }

          const user = await convexQuery<{ email: string }, any | null>("users:getForAuthByEmail", {
            email: normalizedEmail,
          })

          if (!user || !user.passwordHash) {
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.passwordHash)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.image,
            role: user.role === "admin" ? "admin" : "user",
          }
        } catch (error) {
          if (error instanceof Error && error.message === "RATE_LIMITED") {
            throw error
          }
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = (token.role as "user" | "admin" | undefined) || "user"
        session.user.subscriptionStatus =
          (token.subscriptionStatus as "inactive" | "pending" | "active" | "expired" | "cancelled" | undefined) ||
          "inactive"
        session.user.hasActiveSubscription = Boolean(token.hasActiveSubscription)
        session.user.subscriptionExpiresAt =
          typeof token.subscriptionExpiresAt === "number" ? token.subscriptionExpiresAt : null
      }
      return session
    },
    async jwt({ token, user }) {
      const now = Date.now()
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = (user.role as "user" | "admin" | undefined) || "user"
        token.lastSyncedAt = now
      }

      const tokenUserId = typeof token.id === "string" ? token.id : ""
      if (!tokenUserId) {
        return token
      }

      const lastSyncedAt = typeof token.lastSyncedAt === "number" ? token.lastSyncedAt : 0
      if (now - lastSyncedAt < jwtRefreshIntervalMs) {
        return token
      }

      try {
        const dbUser = await convexQuery<{ userId: string }, any | null>("users:getForAuthById", { userId: tokenUserId })
        if (dbUser) {
          token.username = dbUser.username
          token.role = dbUser.role === "admin" ? "admin" : "user"
        }

        const accessState = await convexQuery<{ userId: string }, any | null>("subscriptions:getAccessState", {
          userId: tokenUserId,
        })
        token.subscriptionStatus = accessState?.effectiveStatus || "inactive"
        token.hasActiveSubscription = Boolean(accessState?.hasActiveSubscription)
        token.subscriptionExpiresAt = typeof accessState?.expiresAt === "number" ? accessState.expiresAt : null
      } catch (error) {
        console.error("JWT refresh failed:", error)
      } finally {
        token.lastSyncedAt = now
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
