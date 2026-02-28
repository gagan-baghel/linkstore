import type { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { convexQuery } from "@/lib/convex"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "dev-only-nextauth-secret-change-me",
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const normalizedEmail = credentials.email.trim().toLowerCase()
          const user = await convexQuery<{ email: string }, any | null>("users:getForAuthByEmail", {
            email: normalizedEmail,
          })

          if (!user || !user.passwordHash) {
            console.log("User not found or no password set")
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.passwordHash)

          if (!isPasswordValid) {
            console.log("Invalid password")
            return null
          }

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.image,
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
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
