"use client"

import type React from "react"

import Link from "next/link"
import { useClerk } from "@clerk/nextjs"

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
  const { signOut } = useClerk()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100 px-1.5 py-1 text-[#1c2433] hover:bg-slate-200 focus-visible:outline-none sm:gap-2 sm:px-2">
        <UserAvatar user={{ name: user.name || null, image: user.image || null }} className="h-7 w-7 sm:h-8 sm:w-8" />
        <span className="hidden pr-2 text-sm font-semibold md:inline-block">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/account">Account</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault()
            signOut({ redirectUrl: `${window.location.origin}/auth/login` })
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
