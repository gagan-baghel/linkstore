import crypto from "crypto"

import { SUBSCRIPTION_CURRENCY, SUBSCRIPTION_PRICE_PAISE } from "@/lib/subscription"

type RazorpayOrder = {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  attempts: number
  created_at: number
}

type RazorpayPayment = {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id: string
  method?: string
  captured?: boolean
  created_at: number
  amount_refunded?: number
}

function safeEqualHex(leftHex: string, rightHex: string) {
  const left = Buffer.from(leftHex, "hex")
  const right = Buffer.from(rightHex, "hex")
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY?.trim()
  const keySecret = process.env.RAZORPAY_SECRET?.trim()

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.")
  }

  return { keyId, keySecret }
}

function getWebhookSecret() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim()
  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured.")
  }
  return secret
}

async function razorpayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = getRazorpayConfig()
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })

  const text = await response.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (!response.ok) {
    const message = json?.error?.description || json?.error?.reason || `Razorpay request failed (${response.status})`
    throw new Error(message)
  }

  return json as T
}

export async function createRazorpayOrder(input: { receipt: string; notes?: Record<string, string> }) {
  const order = await razorpayRequest<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: SUBSCRIPTION_PRICE_PAISE,
      currency: SUBSCRIPTION_CURRENCY,
      receipt: input.receipt,
      notes: input.notes || {},
    }),
  })

  if (order.amount !== SUBSCRIPTION_PRICE_PAISE || order.currency !== SUBSCRIPTION_CURRENCY) {
    throw new Error("Unexpected Razorpay order amount or currency.")
  }

  return order
}

export async function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
  })
}

export function verifyRazorpayPaymentSignature(input: { orderId: string; paymentId: string; signature: string }) {
  const { keySecret } = getRazorpayConfig()
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex")

  const received = input.signature.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(received)) return false
  return safeEqualHex(expected, received)
}

export function verifyRazorpayWebhookSignature(rawBody: string, signatureHeader: string) {
  const webhookSecret = getWebhookSecret()
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")
  const received = signatureHeader.trim().toLowerCase()

  if (!/^[a-f0-9]{64}$/.test(received)) return false
  return safeEqualHex(expected, received)
}

export function getPublicRazorpayKeyId() {
  return getRazorpayConfig().keyId
}
