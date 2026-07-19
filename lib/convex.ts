import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

declare global {
  var __convexClient: ConvexHttpClient | undefined
}

function getConvexUrl() {
  return process.env.CONVEX_URL?.trim()
}

function getConvexClient() {
  const url = getConvexUrl()
  if (!url) {
    throw new Error("Please define CONVEX_URL in your environment.")
  }

  if (!global.__convexClient) {
    global.__convexClient = new ConvexHttpClient(url)
  }

  return global.__convexClient
}

// Attach the shared secret so guarded Convex functions accept the call.
// See lib/convex-guard.ts.
function withServerSecret<TArgs extends Record<string, any>>(args: TArgs) {
  // Migration-only escape hatch: deployments running pre-guard functions
  // reject the extra _serverSecret arg. Remove this flag from the env once the
  // guarded functions AND the deployment-side SERVER_SHARED_SECRET are live.
  if (process.env.DISABLE_CONVEX_GUARD === "true") {
    return args
  }
  const secret = process.env.SERVER_SHARED_SECRET?.trim()
  if (!secret) {
    throw new Error("Please define SERVER_SHARED_SECRET in your environment.")
  }
  return { ...args, _serverSecret: secret }
}

export async function convexQuery<TArgs extends Record<string, any>, TResult>(
  name: string,
  args: TArgs,
): Promise<TResult> {
  const client = getConvexClient()
  const ref = makeFunctionReference<"query", TArgs, TResult>(name) as any
  return client.query(ref, withServerSecret(args) as any)
}

export async function convexMutation<TArgs extends Record<string, any>, TResult>(
  name: string,
  args: TArgs,
): Promise<TResult> {
  const client = getConvexClient()
  const ref = makeFunctionReference<"mutation", TArgs, TResult>(name) as any
  return client.mutation(ref, withServerSecret(args) as any)
}

export async function convexAction<TArgs extends Record<string, any>, TResult>(
  name: string,
  args: TArgs,
): Promise<TResult> {
  const client = getConvexClient()
  const ref = makeFunctionReference<"action", TArgs, TResult>(name) as any
  return client.action(ref, withServerSecret(args) as any)
}
