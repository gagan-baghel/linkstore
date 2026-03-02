import { auth, currentUser } from "@clerk/nextjs/server"

import { convexMutation, convexQuery } from "@/lib/convex"

type SessionUser = {
  id: string
  clerkUserId: string
  name: string
  email: string
  image?: string
  username?: string
  role?: "user" | "admin"
  subscriptionStatus?: "inactive" | "pending" | "active" | "expired" | "cancelled"
  hasActiveSubscription?: boolean
  subscriptionExpiresAt?: number | null
}

export type SafeSession = {
  user: SessionUser
}

function getNameFromClerkUser(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return "User"

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  if (fullName) return fullName

  if (user.username) return user.username

  const primaryEmail = user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress || ""
  if (primaryEmail) return primaryEmail.split("@")[0]

  return "User"
}

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>, clerkUserId: string) {
  const email =
    user?.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress?.trim().toLowerCase() || ""
  if (email) return email

  return `${clerkUserId}@users.clerk.local`
}

export async function getSafeServerSession(): Promise<SafeSession | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null

    const clerkUser = await currentUser()
    const email = getPrimaryEmail(clerkUser, userId)
    const name = getNameFromClerkUser(clerkUser)
    const image = clerkUser?.imageUrl || ""

    const result = await convexMutation<
      { clerkUserId: string; email: string; name: string; image?: string },
      { ok: boolean; message?: string; user?: any }
    >("users:upsertFromClerk", {
      clerkUserId: userId,
      email,
      name,
      image,
    })

    if (!result.ok || !result.user?._id) {
      throw new Error(result.message || "Unable to resolve user account.")
    }

    const accessState = await convexQuery<{ userId: string }, any | null>("subscriptions:getAccessState", {
      userId: result.user._id,
    })

    return {
      user: {
        id: result.user._id,
        clerkUserId: userId,
        name: result.user.name || name,
        email: result.user.email || email,
        image: result.user.image || image,
        username: result.user.username,
        role: result.user.role === "admin" ? "admin" : "user",
        subscriptionStatus: accessState?.effectiveStatus || "inactive",
        hasActiveSubscription: Boolean(accessState?.hasActiveSubscription),
        subscriptionExpiresAt: typeof accessState?.expiresAt === "number" ? accessState.expiresAt : null,
      },
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : String(error)
      console.warn("Session read failed; treating request as signed out:", message)
    }
    return null
  }
}
