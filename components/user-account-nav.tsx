"use client"

import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"

import { logoutFromApp } from "@/lib/client-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    name?: string | null
    image?: string | null
    email?: string | null
  }
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      await logoutFromApp()
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error(error)
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 overflow-hidden rounded-[1rem] border border-white/80 bg-white/88 px-1 py-1 text-[#1c2433] shadow-[0_10px_24px_rgba(87,107,149,0.08)] hover:bg-white focus-visible:outline-none sm:gap-2 sm:px-2">
        <UserAvatar user={{ name: user.name || null, image: user.image || null }} className="h-7 w-7 sm:h-8 sm:w-8" />
        <span className="hidden pr-1 text-sm font-semibold md:inline-block">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && <p className="w-52 truncate text-sm text-muted-foreground">{user.email}</p>}
          </div>
        </div>
        {isMobile ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault()
                void handleSignOut()
              }}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
