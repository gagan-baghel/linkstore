"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"

export function DashboardSignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden h-8 rounded-md border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-none hover:bg-slate-100 sm:inline-flex"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
    >
      <LogOut className="mr-1.5 h-4 w-4" />
      Logout
    </Button>
  )
}
