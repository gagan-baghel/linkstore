"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  nextPath?: string
  nextLabel?: string
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return "-"
  try {
    const date = new Date(timestamp)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const day = String(date.getUTCDate()).padStart(2, "0")
    const hours = String(date.getUTCHours()).padStart(2, "0")
    const minutes = String(date.getUTCMinutes()).padStart(2, "0")
    const seconds = String(date.getUTCSeconds()).padStart(2, "0")
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`
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

export function SubscriptionStatusCard({
  initialAccess,
  userName,
  userEmail,
  nextPath,
  nextLabel,
}: SubscriptionStatusCardProps) {
  const router = useRouter()
  const [access, setAccess] = useState<SubscriptionAccessState | null>(initialAccess)
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponMessage, setCouponMessage] = useState<string | null>(null)

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

  function completeActivation(nextAccess: SubscriptionAccessState | null, description: string) {
    setAccess(nextAccess)
    if (nextPath) {
      router.push(nextPath)
    }
    router.refresh()

    toast({
      title: "Subscription activated",
      description,
    })
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

    completeActivation(
      data.access || null,
      nextLabel ? `Your plan is active. Continuing to ${nextLabel.toLowerCase()}.` : "Your plan is active. Premium features are now unlocked.",
    )
  }

  async function handleCheckout() {
    setIsProcessing(true)
    setCouponMessage(null)

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
        name: "Linkstore",
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

  async function handleCouponRedeem() {
    const normalized = couponCode.trim()
    if (!normalized) {
      setCouponMessage("Enter a coupon code first.")
      return
    }

    setIsProcessing(true)
    setCouponMessage(null)

    try {
      const response = await fetch("/api/subscription/coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponCode: normalized }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Coupon could not be applied.")
      }

      setCouponCode("")
      setCouponMessage("Coupon applied. Your store access is now active.")
      completeActivation(
        data.access || null,
        nextLabel ? `Your free month is active. Continuing to ${nextLabel.toLowerCase()}.` : "Your free month is active. Premium features are now unlocked.",
      )
    } catch (error) {
      console.error("Coupon redemption error:", error)
      const message = error instanceof Error ? error.message : "Coupon could not be applied."
      setCouponMessage(message)
      toast({
        title: "Coupon failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className="rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] sm:rounded-xl sm:p-5 sm:shadow-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subscription</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900 sm:text-lg">Starter Monthly Plan</h3>
          <p className="text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">₹149 per month, up to 200 products.</p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">
          {statusLabel}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expires</p>
          <p className="mt-1 text-base text-slate-900">{formatDate(access?.expiresAt || null)}</p>
        </div>
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products Used</p>
          <p className="mt-1 text-base text-slate-900">
            {access?.currentProductCount ?? 0} / {access?.productLimit ?? 200}
          </p>
        </div>
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining Slots</p>
          <p className="mt-1 text-base text-slate-900">{access?.remainingProductSlots ?? 0}</p>
        </div>
      </div>

      {!access?.hasActiveSubscription && (
        <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-900">
          <AlertDescription>
            Premium actions are locked until payment is confirmed. Store creation and product additions stay blocked by server checks.
          </AlertDescription>
        </Alert>
      )}

      {access?.hasActiveSubscription && nextPath ? (
        <Alert className="mt-4 border-emerald-200 bg-emerald-50 text-emerald-900">
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">You already have access. Continue where you left off.</span>
            <Button asChild size="sm" className="h-8 w-full border border-emerald-700 bg-emerald-700 px-3 text-xs text-white hover:bg-emerald-800 sm:w-auto">
              <Link href={nextPath}>
                {nextLabel || "Continue"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          onClick={handleCheckout}
          disabled={isProcessing || !canRenew}
          className="h-11 w-full rounded-lg border border-slate-900 bg-slate-900 px-4 text-sm text-white hover:bg-slate-800 sm:h-9 sm:w-auto"
        >
          {isProcessing ? "Processing..." : access?.effectiveStatus === "active" ? "Renew +30 Days" : "Pay ₹149 Now"}
        </Button>
        <Button
          variant="outline"
          onClick={refreshStatus}
          className="h-11 w-full rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 sm:h-9 sm:w-auto"
          disabled={isProcessing}
        >
          Refresh Status
        </Button>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coupon Access</p>
        <p className="mt-1 text-sm text-slate-600">Apply a valid coupon to unlock one month of store access for free.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="Enter coupon code"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={64}
            disabled={isProcessing}
            className="h-11 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 sm:h-9"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCouponRedeem}
            disabled={isProcessing}
            className="h-11 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 sm:h-9 sm:w-auto"
          >
            Apply Coupon
          </Button>
        </div>
        {couponMessage ? <p className="mt-2 text-xs text-slate-600">{couponMessage}</p> : null}
      </div>

      {nextLabel ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="flex items-center gap-2 font-semibold text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Next step after activation
          </p>
          <p className="mt-1">
            {nextLabel} will open automatically once payment verification completes.
          </p>
        </div>
      ) : null}
    </section>
  )
}
