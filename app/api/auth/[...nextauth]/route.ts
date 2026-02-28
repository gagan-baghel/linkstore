import type { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { convexQuery } from "@/lib/convex"
import { checkRateLimit, getClientIp } from "@/lib/security"

const nextAuthSecret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "development-only-change-before-production" : "")

if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is required in production.")
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
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
          const ip = getClientIp(new Headers(req?.headers || {}))
          const rateKey = `auth:login:${ip}:${normalizedEmail}`
          const rate = checkRateLimit({ key: rateKey, windowMs: 10 * 60 * 1000, max: 20 })
          if (!rate.allowed) {
            return null
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
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = (user.role as "user" | "admin" | undefined) || "user"
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
