import { NextResponse } from "next/server"
import { z } from "zod"

import { convexMutation, convexQuery } from "@/lib/convex"
import { checkRateLimitAsync, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { isValidWhatsAppNumber } from "@/lib/whatsapp"

const createLeadSchema = z
  .object({
    storeUsername: z.string().trim().min(1).max(64),
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().email().max(160).optional().or(z.literal("")),
    whatsapp: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || isValidWhatsAppNumber(value), "Invalid WhatsApp number"),
    consent: z.literal(true),
    source: z.string().trim().max(100).optional(),
    medium: z.string().trim().max(100).optional(),
    campaign: z.string().trim().max(120).optional(),
    content: z.string().trim().max(120).optional(),
    term: z.string().trim().max(120).optional(),
    collectionSlug: z.string().trim().max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.whatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Provide an email or WhatsApp number.",
      })
    }
  })

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = await checkRateLimitAsync({ key: `api:audience-leads:${ip}`, windowMs: 60 * 1000, max: 30 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const body = await req.json()
    const payload = createLeadSchema.parse(body)
    const owner = await convexQuery<{ username: string }, { _id: string; username: string } | null>(
      "users:getPublicByUsername",
      { username: payload.storeUsername },
    )

    if (!owner?._id) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 })
    }

    const result = await convexMutation<
      {
        userId: string
        storeUsername: string
        name?: string
        email?: string
        whatsapp?: string
        consent: boolean
        source?: string
        medium?: string
        campaign?: string
        content?: string
        term?: string
        collectionSlug?: string
      },
      { ok: boolean; message?: string }
    >("audienceLeads:createLead", {
      userId: owner._id,
      storeUsername: owner.username,
      name: payload.name || "",
      email: payload.email || "",
      whatsapp: payload.whatsapp || "",
      consent: payload.consent,
      source: payload.source || "direct",
      medium: payload.medium || "",
      campaign: payload.campaign || "",
      content: payload.content || "",
      term: payload.term || "",
      collectionSlug: payload.collectionSlug || "",
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message || "Unable to capture lead" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid payload", errors: error.errors }, { status: 400 })
    }

    console.error("Audience lead error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
