"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import type { SubscriptionAccessState } from "@/lib/subscription"

declare global {
  interface Window {
    Razorpay?: any
  }
}

type CheckoutPayload = {
  keyId: string
  orderId: string
  amountPaise: number
  currency: string
  planCode: string
  planName: string
}

interface SubscriptionStatusCardProps {
  initialAccess: SubscriptionAccessState | null
  userName: string
  userEmail: string
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return "-"
  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return "-"
  }
}

function loadRazorpayCheckoutScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function SubscriptionStatusCard({ initialAccess, userName, userEmail }: SubscriptionStatusCardProps) {
  const router = useRouter()
  const [access, setAccess] = useState<SubscriptionAccessState | null>(initialAccess)
  const [isProcessing, setIsProcessing] = useState(false)

  const statusLabel = useMemo(() => {
    const status = access?.effectiveStatus || "inactive"
    return status.charAt(0).toUpperCase() + status.slice(1)
  }, [access?.effectiveStatus])

  const canRenew = true

  async function refreshStatus() {
    try {
      const response = await fetch("/api/subscription/status", { method: "GET" })
      const data = await response.json()
      if (response.ok) {
        setAccess(data.access || null)
      }
    } catch (error) {
      console.error("Subscription refresh error:", error)
    }
  }

  async function verifyPayment(razorpayResponse: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) {
    const response = await fetch("/api/subscription/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(razorpayResponse),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || "Payment verification failed")
    }

    setAccess(data.access || null)
    router.refresh()

    toast({
      title: "Subscription activated",
      description: "Your plan is active. Premium features are now unlocked.",
    })
  }

  async function handleCheckout() {
    setIsProcessing(true)

    try {
      const scriptLoaded = await loadRazorpayCheckoutScript()
      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay checkout.")
      }

      const checkoutResponse = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: `checkout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        }),
      })

      const checkoutData = await checkoutResponse.json().catch(() => ({}))
      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.message || "Could not start checkout")
      }

      const checkout: CheckoutPayload = checkoutData.checkout
      if (!checkout?.orderId || !checkout?.keyId) {
        throw new Error("Checkout payload is incomplete")
      }

      const rzp = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amountPaise,
        currency: checkout.currency,
        order_id: checkout.orderId,
        name: "AffiliateHub",
        description: `${checkout.planName} (₹149 / month)`,
        prefill: {
          name: userName || "",
          email: userEmail || "",
        },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            await verifyPayment(response)
          } catch (error) {
            console.error(error)
            toast({
              title: "Verification failed",
              description: error instanceof Error ? error.message : "Unable to verify payment",
              variant: "destructive",
            })
            await refreshStatus()
          }
        },
        modal: {
          ondismiss: async () => {
            await refreshStatus()
          },
        },
      })

      rzp.open()
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unable to start checkout",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subscription</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Starter Monthly Plan</h3>
          <p className="text-sm text-slate-600">₹149 per month, up to 200 products.</p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">
          {statusLabel}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expires</p>
          <p className="mt-1 text-slate-900">{formatDate(access?.expiresAt || null)}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products Used</p>
          <p className="mt-1 text-slate-900">
            {access?.currentProductCount ?? 0} / {access?.productLimit ?? 200}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining Slots</p>
          <p className="mt-1 text-slate-900">{access?.remainingProductSlots ?? 0}</p>
        </div>
      </div>

      {!access?.hasActiveSubscription && (
        <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-900">
          <AlertDescription>
            Premium actions are locked until payment is confirmed. Store creation and product additions stay blocked by server checks.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          onClick={handleCheckout}
          disabled={isProcessing || !canRenew}
          className="h-9 w-full rounded-md border border-slate-900 bg-slate-900 px-4 text-sm text-white hover:bg-slate-800 sm:w-auto"
        >
          {isProcessing ? "Processing..." : access?.effectiveStatus === "active" ? "Renew +30 Days" : "Pay ₹149 Now"}
        </Button>
        <Button variant="outline" onClick={refreshStatus} className="h-9 w-full rounded-md sm:w-auto" disabled={isProcessing}>
          Refresh Status
        </Button>
      </div>
    </section>
  )
}
