"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date)
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
  const [processingAction, setProcessingAction] = useState<"checkout" | "coupon" | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const statusPollTimeoutRef = useRef<number | null>(null)
  const activationHandledRef = useRef(false)
  const isProcessing = processingAction !== null

  const statusLabel = useMemo(() => {
    const status = access?.effectiveStatus || "inactive"
    return status.charAt(0).toUpperCase() + status.slice(1)
  }, [access?.effectiveStatus])

  const canRenew = true

  useEffect(() => {
    return () => {
      if (statusPollTimeoutRef.current !== null) {
        window.clearTimeout(statusPollTimeoutRef.current)
      }
    }
  }, [])

  function stopStatusPolling() {
    if (statusPollTimeoutRef.current !== null) {
      window.clearTimeout(statusPollTimeoutRef.current)
      statusPollTimeoutRef.current = null
    }
  }

  function activationDescription() {
    return nextLabel ? `Your plan is active. Continuing to ${nextLabel.toLowerCase()}.` : "Your plan is active. Premium features are now unlocked."
  }

  function couponActivationDescription() {
    if (access?.hasActiveSubscription) {
      return "Your free month has been added to the current subscription."
    }
    return nextLabel
      ? `Your free month is active. Continuing to ${nextLabel.toLowerCase()}.`
      : "Your free month is active. Premium features are now unlocked."
  }

  function completeActivation(nextAccess: SubscriptionAccessState | null, description: string) {
    stopStatusPolling()
    setAccess(nextAccess)
    if (activationHandledRef.current) {
      return
    }
    activationHandledRef.current = true
    if (nextPath) {
      window.location.assign(nextPath)
      return
    }
    router.refresh()

    toast({
      title: "Subscription activated",
      description,
    })
  }

  async function refreshStatus(input?: { continueOnActivate?: boolean }) {
    try {
      const response = await fetch("/api/subscription/status", { method: "GET", cache: "no-store" })
      const data = await response.json()
      if (response.ok) {
        const nextAccess = data.access || null
        setAccess(nextAccess)
        if (input?.continueOnActivate && nextAccess?.hasActiveSubscription) {
          completeActivation(nextAccess, activationDescription())
        }
        return nextAccess
      }
    } catch (error) {
      console.error("Subscription refresh error:", error)
    }
    return null
  }

  function scheduleStatusPolling(remainingAttempts = 20) {
    stopStatusPolling()
    if (remainingAttempts <= 0 || activationHandledRef.current) {
      return
    }

    statusPollTimeoutRef.current = window.setTimeout(async () => {
      const nextAccess = await refreshStatus({ continueOnActivate: true })
      if (activationHandledRef.current || nextAccess?.hasActiveSubscription) {
        return
      }
      scheduleStatusPolling(remainingAttempts - 1)
    }, 3000)
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
      activationDescription(),
    )
  }

  async function handleCheckout() {
    setProcessingAction("checkout")
    activationHandledRef.current = false
    stopStatusPolling()

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
            const nextAccess = await refreshStatus({ continueOnActivate: true })
            if (!nextAccess?.hasActiveSubscription && !access?.hasActiveSubscription) {
              scheduleStatusPolling(10)
            }
          }
        },
        modal: {
          ondismiss: async () => {
            const nextAccess = await refreshStatus({ continueOnActivate: true })
            if (!nextAccess?.hasActiveSubscription && !access?.hasActiveSubscription) {
              scheduleStatusPolling(10)
            }
          },
        },
      })

      rzp.open()
      if (!access?.hasActiveSubscription) {
        scheduleStatusPolling(25)
      }
    } catch (error) {
      console.error("Checkout error:", error)
      stopStatusPolling()
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unable to start checkout",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(null)
    }
  }

  async function handleApplyCoupon() {
    const normalizedCoupon = couponCode.trim()
    if (!normalizedCoupon) {
      toast({
        title: "Coupon required",
        description: "Enter a coupon code before applying it.",
        variant: "destructive",
      })
      return
    }

    if (access?.hasActiveSubscription) {
      toast({
        title: "Coupon unavailable",
        description: "This coupon can only be redeemed before a subscription is active.",
        variant: "destructive",
      })
      return
    }

    setProcessingAction("coupon")
    activationHandledRef.current = false
    stopStatusPolling()

    try {
      const response = await fetch("/api/subscription/coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: normalizedCoupon,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Could not apply coupon")
      }

      setCouponCode("")
      completeActivation(data.access || null, couponActivationDescription())
    } catch (error) {
      console.error("Coupon error:", error)
      toast({
        title: "Coupon failed",
        description: error instanceof Error ? error.message : "Unable to apply coupon",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(null)
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
            Premium actions are locked until payment is confirmed or a valid coupon is applied. Store creation and product additions stay blocked by server checks.
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
          {processingAction === "checkout" ? "Processing..." : access?.effectiveStatus === "active" ? "Renew +30 Days" : "Pay ₹149 Now"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void refreshStatus()
          }}
          className="h-11 w-full rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 sm:h-9 sm:w-auto"
          disabled={isProcessing}
        >
          Refresh Status
        </Button>
      </div>

      {!access?.hasActiveSubscription ? (
        <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coupon Code</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Enter coupon code"
              className="bg-white"
              disabled={isProcessing}
              maxLength={64}
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={isProcessing || !couponCode.trim()}
              className="h-11 w-full rounded-lg border border-emerald-700 bg-emerald-700 px-4 text-sm text-white hover:bg-emerald-800 sm:h-10 sm:w-auto"
            >
              {processingAction === "coupon" ? "Applying..." : "Apply Coupon"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            A valid coupon adds 30 days of subscription access without a Razorpay charge. Redemptions are one-time per account and can be limited server-side.
          </p>
        </div>
      ) : null}

      {nextLabel ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="flex items-center gap-2 font-semibold text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Next step after activation
          </p>
          <p className="mt-1">
            {nextLabel} will open automatically once activation completes.
          </p>
        </div>
      ) : null}
    </section>
  )
}
