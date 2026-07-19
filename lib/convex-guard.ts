import { actionGeneric as _action, mutationGeneric as _mutation, queryGeneric as _query } from "convex/server"
import { v } from "convex/values"

// Shared-secret gate for Convex functions.
//
// Every Convex function here is public (`*Generic`) and previously trusted its
// caller's `userId` argument without verifying the call came from our Next.js
// server. Anyone who discovered the deployment URL could call them directly and
// bypass session auth (grant themselves a subscription, edit another user's
// store, expire everyone's plan, etc).
//
// Fix: the Next.js server attaches SERVER_SHARED_SECRET to every call (see
// lib/convex.ts); these wrappers verify it. Internal callers (crons, actions)
// pass it from the Convex deployment's own env.
//
// Set SERVER_SHARED_SECRET to the same value on the Next.js server and the
// Convex deployment (Convex dashboard -> Settings -> Environment Variables).
export const SERVER_SECRET_ARG = "_serverSecret"

export function readServerSecret() {
  return process.env.SERVER_SHARED_SECRET?.trim() || ""
}

export function assertServerCall(args: unknown) {
  const expected = readServerSecret()
  if (!expected) {
    // Fail closed: refuse to run until the secret is provisioned.
    throw new Error("SERVER_SHARED_SECRET is not configured on the Convex deployment.")
  }
  const provided = (args as Record<string, unknown> | null | undefined)?.[SERVER_SECRET_ARG]
  if (typeof provided !== "string" || provided !== expected) {
    throw new Error("Unauthorized: this function may only be called by the Linkstore server.")
  }
}

// Preserve the underlying builder's exact type (B) so Convex's handler
// inference (ctx/args typing) keeps working in every function file. Only the
// runtime implementation adds the secret arg + check.
function wrap<B extends (def: any) => any>(builder: B): B {
  return ((def: any) => {
    const args = { ...(def.args ?? {}), [SERVER_SECRET_ARG]: v.optional(v.string()) }
    return builder({
      ...def,
      args,
      handler: (ctx: any, handlerArgs: any) => {
        assertServerCall(handlerArgs)
        return def.handler(ctx, handlerArgs)
      },
    })
  }) as B
}

// Drop-in replacements: same call signature as the originals, so function files
// only change their import source.
export const mutationGeneric = wrap(_mutation)
export const queryGeneric = wrap(_query)
export const actionGeneric = wrap(_action)
