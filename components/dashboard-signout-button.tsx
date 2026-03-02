"use client"

import { LogOut } from "lucide-react"
import { useClerk } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DashboardSignOutButton({ className }: { className?: string }) {
  const { signOut } = useClerk()

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-9 rounded-md border-red-300 bg-transparent px-3 text-xs text-red-600 shadow-none hover:border-red-400 hover:bg-red-50 hover:text-red-700",
        className,
      )}
      onClick={() => signOut({ redirectUrl: "/auth/login" })}
    >
      <LogOut className="mr-1.5 h-4 w-4" />
      Logout
    </Button>
  )
}
