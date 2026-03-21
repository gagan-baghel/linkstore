"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { logoutFromApp } from "@/lib/client-auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DashboardSignOutButton({ className }: { className?: string }) {
  const router = useRouter()
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
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-10 rounded-xl border-[#f0c8cf] bg-white/80 px-3 text-xs text-[#b14b5b] shadow-none hover:border-[#e5aebb] hover:bg-[#fff5f7] hover:text-[#983949]",
        className,
      )}
      disabled={isSigningOut}
      onClick={() => {
        void handleSignOut()
      }}
    >
      <LogOut className="mr-1.5 h-4 w-4" />
      {isSigningOut ? "Signing out..." : "Logout"}
    </Button>
  )
}
