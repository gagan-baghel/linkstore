"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function SessionSecurityCard({ email }: { email: string }) {
  const [isRevoking, setIsRevoking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function revokeOtherSessions() {
    setIsRevoking(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        credentials: "same-origin",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || "Unable to revoke sessions.")
      }

      toast({
        title: "Sessions updated",
        description: "Other active sessions were signed out.",
      })
    } catch (submitError) {
      console.error(submitError)
      setError(submitError instanceof Error ? submitError.message : "Unable to revoke sessions.")
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#d8e2f3] bg-white p-5 md:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[#162033]">Google Sign-In</h2>
        <p className="text-sm text-[#4f5f7a]">
          Your verified Google account is the only authentication method for AffiliateHub.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4 text-sm text-[#1f2a44]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Connected Account</p>
        <p className="mt-1 break-all font-medium">{email || "No Google email available"}</p>
        <p className="mt-2 text-xs text-[#60708a]">
          Email ownership, password resets, multi-factor auth, and account recovery are managed in your Google account.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#4f5f7a]">
          Revoke other AffiliateHub sessions if you signed in on a shared device.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isRevoking}
          className="h-10 border-[#cfd8ea] bg-white px-4 text-sm text-[#1f2a44] shadow-[0_10px_24px_rgba(19,34,68,0.14)] hover:bg-[#f3f6fc]"
          onClick={() => {
            void revokeOtherSessions()
          }}
        >
          {isRevoking ? "Revoking..." : "Sign out other sessions"}
        </Button>
      </div>
    </div>
  )
}
